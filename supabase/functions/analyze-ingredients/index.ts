import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { ingredients, productName, image, productType = "food" } = await req.json();
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured");
    }

    console.log("[ANALYZE] Started at:", new Date().toISOString());
    console.log("[ANALYZE] Product:", productName, "| Type:", productType, "| Has image:", !!image);

    const systemPrompts = {
      food: `أنت "المجلس العلمي للكيمياء الغذائية". حلل المكونات الغذائية وقدم تحليلاً علمياً شاملاً باللغة العربية.

المبادئ:
1. استند إلى أدلة علمية (FDA, EFSA)
2. أي مكون غير واضح = مخاطرة
3. كشف الخداع: "تجزئة السكر"، مكونات غامضة
4. تحليل الحلال/الحرام: منتجات الخنزير أو الكحول = حرام`,
      
      cosmetic: `أنت "المجلس العلمي لكيمياء المستحضرات التجميلية". حلل مكونات المستحضرات التجميلية وقدم تحليلاً علمياً باللغة العربية.

المبادئ:
1. استند إلى أدلة علمية (FDA, EWG, EU Cosmetics)
2. ركز على: Parabens, Phthalates, Sulfates, Formaldehyde, Siloxanes
3. تقييم الحلال: مشتقات الخنزير، الكحول الإيثيلي، مكونات حيوانية غير حلال`
    };

    const systemPrompt = systemPrompts[productType as keyof typeof systemPrompts] || systemPrompts.food;

    // Build the user prompt based on whether we have an image or text
    let userPrompt: string;
    
    if (image) {
      // For images, ask DeepSeek to extract and analyze in one go
      userPrompt = `الصورة المرفقة تحتوي على قائمة مكونات منتج "${productName}".

المطلوب:
1. استخرج المكونات من الصورة
2. حلل كل مكون علمياً

قدم التحليل بصيغة JSON:
{
  "productName": "اسم المنتج",
  "overallScore": رقم 0-100,
  "verdict": "ممتاز/جيد/مقبول/سيء/خطر",
  "summary": "ملخص قصير",
  "halalStatus": "حلال/حرام",
  "negativeIngredients": [{"name": "", "description": "", "severity": "خطر/عالي/متوسط", "impact": "", "affectedOrgan": ""}],
  "positiveIngredients": [{"name": "", "description": "", "benefit": "", "affectedOrgan": ""}],
  "suspiciousIngredients": [{"name": "", "description": "", "concern": "", "affectedOrgan": ""}],
  "recommendations": []
}

الأعضاء المتاحة: الكبد، الكلى، الجلد، الرئتين، الدماغ، القلب، المعدة، الأمعاء`;
    } else {
      userPrompt = `حلل المكونات التالية للمنتج "${productName}":
${ingredients}

قدم التحليل بصيغة JSON:
{
  "productName": "اسم المنتج",
  "overallScore": رقم 0-100,
  "verdict": "ممتاز/جيد/مقبول/سيء/خطر",
  "summary": "ملخص قصير",
  "halalStatus": "حلال/حرام",
  "negativeIngredients": [{"name": "", "description": "", "severity": "خطر/عالي/متوسط", "impact": "", "affectedOrgan": ""}],
  "positiveIngredients": [{"name": "", "description": "", "benefit": "", "affectedOrgan": ""}],
  "suspiciousIngredients": [{"name": "", "description": "", "concern": "", "affectedOrgan": ""}],
  "recommendations": []
}

الأعضاء المتاحة: الكبد، الكلى، الجلد، الرئتين، الدماغ، القلب، المعدة، الأمعاء`;
    }

    // Build message content
    const messageContent: any[] = [{ type: "text", text: userPrompt }];
    
    if (image) {
      messageContent.push({
        type: "image_url",
        image_url: { url: image }
      });
    }

    console.log("[ANALYZE] Calling DeepSeek API...");
    const apiCallStart = Date.now();

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageContent },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    console.log("[ANALYZE] DeepSeek API call took:", Date.now() - apiCallStart, "ms");

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ANALYZE] DeepSeek API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: "خطأ في مفتاح DeepSeek API" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "خطأ في خدمة التحليل" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    console.log("[ANALYZE] Response received, parsing JSON...");

    // Extract JSON from the response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          analysisResult = JSON.parse(jsonObjectMatch[0]);
        } else {
          throw new Error("Could not extract JSON from response");
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log("[ANALYZE] Total processing time:", totalTime, "ms");
    console.log("[ANALYZE] Completed successfully");

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ANALYZE] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured");
    }

    console.log("[ANALYZE] Started at:", new Date().toISOString());
    console.log("[ANALYZE] Product:", productName, "| Type:", productType, "| Has image:", !!image);

    // If image is provided, use Lovable AI (Gemini) to extract ingredients first
    // DeepSeek does NOT support image analysis
    let ingredientsText = ingredients;
    
    if (image) {
      console.log("[ANALYZE] Extracting ingredients from image using Gemini...");
      
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured for image extraction");
      }
      
      const extractStart = Date.now();
      const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "استخرج قائمة المكونات من هذه الصورة. اكتب فقط المكونات كما هي مكتوبة على المنتج، بدون أي تعليقات."
                },
                {
                  type: "image_url",
                  image_url: { url: image }
                }
              ]
            }
          ],
        }),
      });

      console.log("[ANALYZE] Gemini extraction took:", Date.now() - extractStart, "ms");

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        console.error("[ANALYZE] Gemini error:", visionResponse.status, errorText);
        throw new Error("Failed to extract ingredients from image");
      }

      const visionData = await visionResponse.json();
      ingredientsText = visionData.choices[0].message.content;
      console.log("[ANALYZE] Extracted ingredients:", ingredientsText.substring(0, 100));
    }

    const systemPrompt = productType === "cosmetic" 
      ? `أنت خبير تحليل مستحضرات تجميلية. حلل المكونات وقدم تحليلاً علمياً باللغة العربية. ركز على: Parabens, Phthalates, Sulfates, Formaldehyde.`
      : `أنت خبير تحليل مكونات غذائية. حلل المكونات وقدم تحليلاً علمياً باللغة العربية. كشف الحلال/الحرام.`;

    const userPrompt = `حلل المكونات التالية للمنتج "${productName}":
${ingredientsText}

قدم التحليل بصيغة JSON فقط:
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

الأعضاء: الكبد، الكلى، الجلد، الرئتين، الدماغ، القلب، المعدة، الأمعاء`;

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
          { role: "user", content: userPrompt },
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
    console.log("[ANALYZE] Total time:", totalTime, "ms | Completed successfully");

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

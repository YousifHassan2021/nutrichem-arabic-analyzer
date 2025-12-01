import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, productName, image, productType = "food" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing ingredients for product:", productName);
    console.log("Product type:", productType);
    console.log("Has image:", !!image);

    const systemPrompts = {
      food: `أنت "المجلس العلمي للكيمياء الغذائية (NutriChem-V4.0 Scientific Directorate)". أنت نظام تحليلي خبير مهمتك فحص مكونات المنتجات الغذائية وتقديم تحليل علمي شامل باللغة العربية.

المبادئ الأساسية:
1. الدليل أولاً: استند إلى أدلة علمية من هيئات معترف بها (FDA, EFSA, etc.)
2. التقييم التحوطي: أي مكون يفتقر إلى إجماع علمي يُعامل كمخاطرة
3. كشف الخداع: ابحث عن أنماط مضللة مثل "تجزئة السكر" والمكونات الغامضة
4. تحليل دقيق: صنف كل مكون إلى: سلبي، إيجابي، أو مشكوك فيه
5. تحليل الحلال والحرام: **يجب** الكشف عن المكونات المحرمة (لحم الخنزير أو منتجات الخنزير، الكحول أو المشروبات الكحولية) وتحديد حالة المنتج

يجب أن تحلل المكونات وتصنفها بدقة مع تقديم تفسير علمي لكل تصنيف.`,
      
      cosmetic: `أنت "المجلس العلمي لكيمياء المستحضرات التجميلية (CosmeticChem-V1.0 Scientific Directorate)". أنت نظام تحليلي خبير مهمتك فحص مكونات المستحضرات التجميلية ومنتجات العناية الشخصية وتقديم تحليل علمي شامل باللغة العربية.

المبادئ الأساسية:
1. الدليل أولاً: استند إلى أدلة علمية من هيئات معترف بها (FDA, EWG, EU Cosmetics Regulation, etc.)
2. تقييم الأمان الجلدي: ركز على المكونات التي قد تسبب تهيج، حساسية، أو مشاكل جلدية
3. كشف المواد المثيرة للقلق:
   - Parabens (مواد حافظة مثيرة للجدل)
   - Phthalates (ملدنات محتملة الخطر)
   - Sulfates (منظفات قاسية مثل SLS, SLES)
   - Formaldehyde و مطلقات الفورمالدهايد
   - Siloxanes (D4, D5, D6)
   - Synthetic fragrances و مكونات عطرية مبهمة
   - Mineral oil و Petrolatum (في بعض الحالات)
   - مكونات مشتقة من حيوانات
4. تحليل دقيق: صنف كل مكون إلى: سلبي، إيجابي، أو مشكوك فيه
5. تقييم الحلال والحرام: ركز على:
   - مشتقات الخنزير (Porcine derivatives, Pork collagen, etc.)
   - الكحول الإيثيلي (Ethanol, Ethyl Alcohol) في التركيبات
   - مكونات حيوانية غير حلال (Carmine, Cochineal, غير مذبوحة حسب الشريعة)
6. المكونات الطبيعية مقابل الصناعية: وضح ما هو طبيعي وما هو صناعي
7. ملاءمة نوع البشرة: إذا أمكن، حدد مدى ملاءمة المنتج لأنواع البشرة المختلفة

يجب أن تحلل المكونات التجميلية وتصنفها بدقة مع تقديم تفسير علمي يركز على السلامة الجلدية والصحة العامة.`
    };

    const systemPrompt = systemPrompts[productType as keyof typeof systemPrompts] || systemPrompts.food;

    // If image is provided, use vision to extract ingredients first
    let ingredientsText = ingredients;
    if (image) {
      console.log("Extracting ingredients from image...");
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
                  text: "استخرج قائمة المكونات من هذه الصورة بشكل دقيق. اكتب فقط قائمة المكونات كما هي مكتوبة على المنتج، بدون أي إضافات أو تعليقات. إذا كانت القائمة بالعربية، اكتبها بالعربية. إذا كانت بالإنجليزية، اكتبها بالإنجليزية."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
        }),
      });

      if (!visionResponse.ok) {
        throw new Error("Failed to extract ingredients from image");
      }

      const visionData = await visionResponse.json();
      ingredientsText = visionData.choices[0].message.content;
      console.log("Extracted ingredients:", ingredientsText);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `حلل المكونات التالية للمنتج "${productName}":
${ingredientsText}

قدم التحليل بصيغة JSON التالية (مع التركيز على تحديد العضو المتأثر لكل مكون):
{
  "productName": "اسم المنتج",
  "overallScore": رقم من 0 إلى 100,
  "verdict": "تقييم عام (ممتاز/جيد/مقبول/سيء/خطر)",
  "summary": "ملخص التحليل باللغة العربية",
  "halalStatus": "حلال أو حرام - إذا احتوى على لحم خنزير أو كحول فهو حرام، وإلا فهو حلال",
  "negativeIngredients": [
    {
      "name": "اسم المكون",
      "description": "وصف تفصيلي بالعربية",
      "severity": "خطر/عالي/متوسط",
      "impact": "التأثير الصحي",
      "affectedOrgan": "العضو المتأثر (مثل: الكبد، الكلى، الجلد، الرئتين، الدماغ، القلب، المعدة، الأمعاء)"
    }
  ],
  "positiveIngredients": [
    {
      "name": "اسم المكون",
      "description": "وصف تفصيلي بالعربية",
      "benefit": "الفائدة الصحية",
      "affectedOrgan": "العضو المتأثر إيجابياً (مثل: الكبد، الكلى، الجلد، الرئتين، الدماغ، القلب، المعدة، الأمعاء)"
    }
  ],
  "suspiciousIngredients": [
    {
      "name": "اسم المكون",
      "description": "وصف تفصيلي بالعربية",
      "concern": "القلق المحتمل",
      "affectedOrgan": "العضو المحتمل تأثره (مثل: الكبد، الكلى، الجلد، الرئتين، الدماغ، القلب، المعدة، الأمعاء)"
    }
  ],
  "recommendations": ["توصية 1", "توصية 2", "..."]
}

**مهم جداً**: لكل مكون، يجب تحديد العضو الأكثر تأثراً بناءً على الأدلة العلمية. استخدم الأسماء العربية للأعضاء فقط.`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد إلى حساب Lovable AI الخاص بك" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "خطأ في بوابة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI Response received:", content.substring(0, 200));

    // Extract JSON from the response
    let analysisResult;
    try {
      // Try to parse the entire response as JSON
      analysisResult = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find any JSON object in the response
        const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          analysisResult = JSON.parse(jsonObjectMatch[0]);
        } else {
          throw new Error("Could not extract JSON from AI response");
        }
      }
    }

    console.log("Analysis completed successfully");

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-ingredients function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

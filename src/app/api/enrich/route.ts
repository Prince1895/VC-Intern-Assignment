import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // 1. Fetch website HTML
        let html = '';
        try {
            // Set a User-Agent to avoid basic blocks
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                signal: AbortSignal.timeout(15000)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            html = await response.text();
        } catch (e) {
            console.warn("Fetch failed, falling back or returning error.", e);
            return NextResponse.json({ error: 'Failed to extract website content from ' + url }, { status: 500 });
        }

        // 2. Simplistic HTML to text (strip scripts, styles, tags)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let bodyText = bodyMatch ? bodyMatch[1] : html;

        // Remove unwanted tags
        bodyText = bodyText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
        bodyText = bodyText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        bodyText = bodyText.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');
        // Strip HTML tags
        let cleanText = bodyText.replace(/<[^>]+>/g, ' ');
        // Remove excessive whitespaces
        cleanText = cleanText.replace(/\s+/g, ' ').trim();

        // Take max 30,000 chars to avoid token limits for a quick MVP
        cleanText = cleanText.substring(0, 30000);

        // 3. Call LLM (Gemini)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not set.");
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured on the server' }, { status: 500 });
        }

        const prompt = `
Analyze the following website content from ${url}. 
Extract the following structured information as a strict JSON object:
{
  "summary": "1-2 sentence summary of the company",
  "whatTheyDo": ["3-6 short bullet points describing what they do"],
  "keywords": ["5-10 relevant industry or technology keywords"],
  "derivedSignals": ["2-4 inferred signals from the content, e.g., 'Hiring active (Careers page mentioned)', 'Enterprise focus', 'Recent product launch', 'Open source (GitHub links)']
}

Website Content:
---
${cleanText}
---

Respond ONLY with the raw JSON object, without any Markdown formatting, like \`\`\`json.
`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json",
                }
            })
        });

        if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            console.error("Gemini API error:", errorText);
            throw new Error("Failed to call LLM API");
        }

        const geminiData = await geminiRes.json();
        let resultText = geminiData.candidates[0].content.parts[0].text;

        // Sometimes the LLM returns wrapped in \`\`\`json ... \`\`\`, strip it
        resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

        const parsedData = JSON.parse(resultText);

        // 4. Return formatted data
        return NextResponse.json({
            summary: parsedData.summary || "No summary found.",
            whatTheyDo: Array.isArray(parsedData.whatTheyDo) ? parsedData.whatTheyDo : [],
            keywords: Array.isArray(parsedData.keywords) ? parsedData.keywords : [],
            derivedSignals: Array.isArray(parsedData.derivedSignals) ? parsedData.derivedSignals : [],
            sources: [
                {
                    url: url,
                    timestamp: new Date().toISOString()
                }
            ]
        });

    } catch (error) {
        console.error("Enrichment API error:", error);
        return NextResponse.json({ error: 'Internal server error during enrichment' }, { status: 500 });
    }
}

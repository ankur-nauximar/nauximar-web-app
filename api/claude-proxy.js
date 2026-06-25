export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = req.body;

    // Inject better coordinate instructions into the prompt
    if (body.messages && body.messages[0] && body.messages[0].content) {
      const contentArray = body.messages[0].content;
      const textBlock = contentArray.find(c => c.type === 'text');
      if (textBlock) {
        textBlock.text = textBlock.text + `

CRITICAL COORDINATE RULES FOR IMO FAL FORM 1:
This is a standard A4 form (595 x 842 points).
The form has a table structure. Key field positions:
- Field 1.1 (Name and type of ship): x=30, y=680, font_size=9
- Field 1.2 (IMO number): x=320, y=680, font_size=9
- Field 1.3 (Call sign): x=30, y=650, font_size=9
- Field 1.4 (Voyage number): x=320, y=650, font_size=9
- Field 2 (Port of arrival): x=30, y=615, font_size=9
- Field 3 (Date of arrival): x=320, y=615, font_size=9
- Field 4 (Flag State): x=30, y=580, font_size=9
- Field 5 (Name of master): x=185, y=580, font_size=9
- Field 6 (Last port/Next port): x=355, y=580, font_size=9
- Field 7 (Certificate of registry): x=30, y=545, font_size=9
- Field 8 (Ship agent): x=320, y=545, font_size=9
- Field 9 (Gross tonnage): x=30, y=510, font_size=9
- Field 10 (Net tonnage): x=185, y=510, font_size=9

Use THESE coordinates for FAL Form 1. For other forms, estimate carefully.
Place text so it fits INSIDE the field box without overlapping borders.`;
      }
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

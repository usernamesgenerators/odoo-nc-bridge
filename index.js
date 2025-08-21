// index.js – works on Node 18+ (Render default)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const { XMLParser } = require('fast-xml-parser');

const API_KEY = '3ed3eb097269443481bb9532a4660bf8';
const USERNAME = 'Remdane';
const CLIENT_IP = '44.229.227.142';
const AFF_LINK = 'https://namecheap.pxf.io/c/3481273/386170/5618';

app.use(express.json());
app.use(express.static('public'));

// إعداد محلل XML
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ''
});

// قائمة الامتدادات المدعومة
const SUPPORTED_EXTENSIONS = ['com', 'net', 'org', 'xyz', 'io', 'ai'];

app.get('/api/check-domain/:name', async (req, res) => {
  const { name } = req.params;
  const { extension = 'com' } = req.query;
  
  // التحقق من أن الامتداد مدعوم
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return res.status(400).json({ 
      error: 'Unsupported extension', 
      supportedExtensions: SUPPORTED_EXTENSIONS 
    });
  }
  
  const domain = `${name}.${extension}`;
  const url = `https://api.sandbox.namecheap.com/xml.response?ApiUser=${USERNAME}&ApiKey=${API_KEY}&UserName=${USERNAME}&ClientIP=${CLIENT_IP}&Command=namecheap.domains.check&DomainList=${domain}`;

  try {
    const xmlRes = await fetch(url);
    if (!xmlRes.ok) {
      return res.status(xmlRes.status).json({ error: `Namecheap API ${xmlRes.status}` });
    }

    const xml = await xmlRes.text();
    const result = parser.parse(xml);
    
    // البحث عن نتيجة التحقق من النطاق في الاستجابة
    let isAvailable = false;
    
    if (result.ApiResponse.CommandResponse && 
        result.ApiResponse.CommandResponse.DomainCheckResult) {
      const checkResult = result.ApiResponse.CommandResponse.DomainCheckResult;
      
      if (Array.isArray(checkResult)) {
        // إذا كانت النتائج مصفوفة
        const domainResult = checkResult.find(d => d.Domain === domain);
        isAvailable = domainResult && domainResult.Available === 'true';
      } else {
        // إذا كانت النتيجة مفردة
        isAvailable = checkResult.Domain === domain && checkResult.Available === 'true';
      }
    }
    
    const affiliateUrl = `${AFF_LINK}?url=https%3A%2F%2Fwww.namecheap.com%2Fdomains%2Fregistration%2Fresults.aspx%3Fdomain%3D${domain}`;

    res.json({ domain, isAvailable, affiliateUrl });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// نقطة نهاية جديدة للتحقق من عدة امتدادات في وقت واحد
app.get('/api/check-multiple-domains/:name', async (req, res) => {
  const { name } = req.params;
  const { extensions = 'com,net,org' } = req.query;
  
  const extensionList = extensions.split(',');
  const results = [];
  
  for (const extension of extensionList) {
    // التحقق من أن الامتداد مدعوم
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      results.push({
        domain: `${name}.${extension}`,
        isAvailable: false,
        error: 'Unsupported extension'
      });
      continue;
    }
    
    const domain = `${name}.${extension}`;
    const url = `https://api.sandbox.namecheap.com/xml.response?ApiUser=${USERNAME}&ApiKey=${API_KEY}&UserName=${USERNAME}&ClientIP=${CLIENT_IP}&Command=namecheap.domains.check&DomainList=${domain}`;

    try {
      const xmlRes = await fetch(url);
      if (!xmlRes.ok) {
        results.push({
          domain,
          isAvailable: false,
          error: `API error: ${xmlRes.status}`
        });
        continue;
      }

      const xml = await xmlRes.text();
      const result = parser.parse(xml);
      
      let isAvailable = false;
      
      if (result.ApiResponse.CommandResponse && 
          result.ApiResponse.CommandResponse.DomainCheckResult) {
        const checkResult = result.ApiResponse.CommandResponse.DomainCheckResult;
        
        if (Array.isArray(checkResult)) {
          const domainResult = checkResult.find(d => d.Domain === domain);
          isAvailable = domainResult && domainResult.Available === 'true';
        } else {
          isAvailable = checkResult.Domain === domain && checkResult.Available === 'true';
        }
      }
      
      const affiliateUrl = `${AFF_LINK}?url=https%3A%2F%2Fwww.namecheap.com%2Fdomains%2Fregistration%2Fresults.aspx%3Fdomain%3D${domain}`;

      results.push({ domain, isAvailable, affiliateUrl });
    } catch (e) {
      console.error('Error checking domain:', domain, e);
      results.push({
        domain,
        isAvailable: false,
        error: 'Internal server error'
      });
    }
  }
  
  res.json({ results });
});

// نقطة نهاية للحصول على الامتدادات المدعومة
app.get('/api/supported-extensions', (req, res) => {
  res.json({ extensions: SUPPORTED_EXTENSIONS });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// index.js – works on Node 18+ (Render default)
const express = require('express');
const app    = express();
const PORT   = process.env.PORT || 3000;

const API_KEY   = '3ed3eb097269443481bb9532a4660bf8';
const USERNAME  = 'Remdane';
const CLIENT_IP = '44.229.227.142';
const AFF_LINK  = 'https://namecheap.pxf.io/c/3481273/386170/5618';

app.use(express.json());
app.use(express.static('public'));

app.get('/api/check-domain/:name', async (req, res) => {
  const domain = `${req.params.name}.com`;
  const url =
    `https://api.sandbox.namecheap.com/xml.response?ApiUser=${USERNAME}&ApiKey=${API_KEY}&UserName=${USERNAME}&ClientIP=${CLIENT_IP}&Command=namecheap.domains.check&DomainList=${domain}`;

  try {
    const xmlRes = await fetch(url);
    if (!xmlRes.ok) return res.status(xmlRes.status).json({ error: `Namecheap API ${xmlRes.status}` });

    const xml = await xmlRes.text();
    const isAvailable = xml.includes('Available="true"');
    const affiliateUrl = `${AFF_LINK}?url=https%3A%2F%2Fwww.namecheap.com%2Fdomains%2Fregistration%2Fresults.aspx%3Fdomain%3D${domain}`;

    res.json({ domain, isAvailable, affiliateUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));

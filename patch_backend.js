const fs = require('fs');
let code = fs.readFileSync('app/api/send-alert/route.ts', 'utf8');

const oldLogic = `    const { area, inspectionLink, areaText } = await request.json();

    // 1. Fetch contacts from DB
    const { rows } = await db.query('SELECT * FROM notification_contacts');
    
    // 2. Separate permanent CCs and the specific Area responsible
    const ccs = rows.filter(c => c.is_permanent_cc).map(c => c.email);
    
    let toEmails = [];
    if (area === 'Otros') {
       // If 'Otros', maybe we just send to CCs or we don't have a specific responsible
       // We'll just send to CCs for now.
    } else {
       const responsibles = rows.filter(c => !c.is_permanent_cc && c.area === area).map(c => c.email);
       toEmails = responsibles;
    }

    if (toEmails.length === 0 && ccs.length === 0) {
      return NextResponse.json({ message: 'No recipients found' }, { status: 200 });
    }

    // 3. Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const finalAreaName = area === 'Otros' ? areaText : area;`;

const newLogic = `    const { areas, inspectionLink, areaText } = await request.json();

    // 1. Fetch contacts from DB
    const { rows } = await db.query('SELECT * FROM notification_contacts');
    
    // 2. Separate permanent CCs and the specific Area responsible
    const ccs = rows.filter(c => c.is_permanent_cc).map(c => c.email);
    
    let toEmails = [];
    let finalAreaName = '';

    if (areas && Array.isArray(areas)) {
        const standardAreas = areas.filter(a => a !== 'Otros');
        const responsibles = rows.filter(c => !c.is_permanent_cc && standardAreas.includes(c.area)).map(c => c.email);
        toEmails = responsibles;
        
        let areaNames = [...standardAreas];
        if (areas.includes('Otros') && areaText) {
            areaNames.push(areaText);
        }
        finalAreaName = areaNames.join(', ');
    }

    if (toEmails.length === 0 && ccs.length === 0) {
      return NextResponse.json({ message: 'No recipients found' }, { status: 200 });
    }

    // 3. Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('app/api/send-alert/route.ts', code, 'utf8');
console.log('Backend patched!');

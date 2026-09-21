const fs = require('fs');
let code = fs.readFileSync('components/inspections/InternasCustomForm.tsx', 'utf8');

const target = `    return (
        <div className="max-w-6xl mx-auto mb-6">`;

const replacement = `    return (
        <>
            <div className="max-w-6xl mx-auto mb-6">`;

const targetEnd = `            <EmailReportModal
                initialObservations={conclusiones || ""} 
                isOpen={showEmailModal} 
                onClose={() => setShowEmailModal(false)}
                isSending={isSaving}
                onSend={async (data) => {`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    
    // We need to find the VERY END of the component and add </>
    // Let's replace the last `</div>\n    );\n}`
    const endTarget = `            </div>
        </div>
    );
}`;
    const endReplacement = `            </div>
        </div>
        </>
    );
}`;
    if (code.includes(endTarget)) {
        code = code.replace(endTarget, endReplacement);
        fs.writeFileSync('components/inspections/InternasCustomForm.tsx', code);
        console.log('Fixed JSX Fragment!');
    } else {
        console.log('Could not find end of component!');
    }
}

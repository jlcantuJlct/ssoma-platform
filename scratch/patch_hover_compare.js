const fs = require('fs');
let code = fs.readFileSync('app/generador-informes/page.tsx', 'utf8');

// Render the reference image ALWAYS, but behind the main image
// And make the uploaded image disappear on hover so the refSrc shows through
// In the current code:
// {tag.preview ? ( <> ... </> ) : ( <div ...> ... </div> )}

// We can just add the ref image into the `tag.preview` branch!
const injectedRefImage = `
                        {refSrc && (
                            <img
                                src={refSrc}
                                alt="Referencia"
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover transition-opacity pointer-events-none opacity-100 mix-blend-screen"
                                style={{ zIndex: -1 }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        )}
                        <img
                            src={tag.preview}
                            alt={tag.label}
                            className={\`w-full h-full object-cover transition-all duration-300 group-hover:opacity-10 \${tag.loading ? 'opacity-40 grayscale blur-sm' : ''}\`}
                            style={{ zIndex: 0 }}
                        />
`;

code = code.replace(
    /<\!-- eslint-disable-next-line @next\/next\/no-img-element -->\s*<img\s*src={tag\.preview}\s*alt={tag\.label}\s*className={`w-full h-full object-cover transition-all \${tag\.loading \? 'opacity-40 grayscale blur-sm' : ''}`}\s*\/>/g,
    injectedRefImage
);

fs.writeFileSync('app/generador-informes/page.tsx', code);
console.log("Patched hover compare");

const fs = require('fs');
const file = 'components/UserMenu.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the first occurrence in the small list
content = content.replace(
    '<UserAvatarWithHistory key={u.id} u={u} isOnline={true} getAvatarColor={getAvatarColor} />',
    '<UserAvatarWithHistory \n                                    key={u.id} \n                                    u={u} \n                                    isOnline={true} \n                                    getAvatarColor={getAvatarColor} \n                                    hasAlert={recentAlerts.includes(u.name)}\n                                />'
);

// Replace the second occurrence in the big list
content = content.replace(
    '<UserAvatarWithHistory key={u.id} u={u} isOnline={isOnline} getAvatarColor={getAvatarColor} />',
    '<UserAvatarWithHistory \n                                        key={u.id} \n                                        u={u} \n                                        isOnline={isOnline} \n                                        getAvatarColor={getAvatarColor} \n                                        hasAlert={recentAlerts.includes(u.name)}\n                                    />'
);

fs.writeFileSync(file, content);
console.log('Patched UserMenu.tsx');

export const calculateObjectiveMonthlyStats = (
    targetObjId: string,
    programData: any,
    OBJECTIVES: any[],
    executedInspections: any[],
    hhcRecords: any[],
    evidenceRecords: any[],
    pmaRecords: any[],
    atsRecords: any[],
    petarRecords: any[],
    detourRecords: any[],
    simulacroRecords: any[],
    brigadistaRecords: any[],
    risstmaRecords: any[],
    reporteAcRecords: any[]
) => {
    const currentList = (programData && programData[targetObjId]) || [];
    const currentObj = OBJECTIVES.find(o => o.id === targetObjId);
    const currentObjLabel = currentObj?.label || '';
    const grouped: any = {};

    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const getWords = (s: string) => s.split(/\s+/).filter((w: string) => w.length > 2);
    const isSubset = (subset: string[], superset: string[]) => {
        return subset.every(subWord => superset.some(superWord => superWord.includes(subWord) || subWord.includes(superWord)));
    };

    const getMonthFromStr = (dateStr: any) => {
        if (!dateStr || typeof dateStr !== 'string') return -1;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length >= 2) return parseInt(parts[1]) - 1;
        }
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length >= 2) return parseInt(parts[1]) - 1;
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? -1 : d.getMonth();
    };

    const hasEvidence = (r: any): boolean => {
        if (!r) return false;
        const pdf = r.evidencePdf || r.evidence_pdf || r.pdfUrl || r.fileUrl || r.file_url || r.evidenceUrl || r.evidence_url || r.fileUrls || r.file_urls;
        if (pdf) {
            if (typeof pdf === 'string' && pdf.trim().length > 10 && !pdf.includes('undefined') && !pdf.includes('null')) return true;
            if (Array.isArray(pdf) && pdf.length > 0) {
                return pdf.some((url: string) => typeof url === 'string' && url.trim().length > 10 && !url.includes('undefined') && !url.includes('null'));
            }
        }
        let imgs = r.evidenceImgs || r.evidence_imgs || r.images || r.imageUrl || r.files;
        if (imgs) {
            if (typeof imgs === 'string' && imgs.trim().startsWith('[') && imgs.trim().endsWith(']')) {
                try { imgs = JSON.parse(imgs); } catch { }
            }
            if (Array.isArray(imgs)) {
                return imgs.some((url: string) => typeof url === 'string' && url.trim().length > 10 && !url.includes('undefined') && !url.includes('null'));
            }
            if (typeof imgs === 'string' && imgs.trim().length > 10 && !imgs.includes('undefined') && !imgs.includes('null')) return true;
        }
        return false;
    };

    const baseAreas = ['SEGURIDAD', 'MEDIO AMBIENTE', 'SALUD'];
    baseAreas.forEach(a => grouped[a] = {});

    currentList.forEach((item: any) => {
        let area = (item.area || 'SEGURIDAD').toUpperCase();
        let key = baseAreas.find(a => area.includes(a));
        if (!key) {
            key = 'OTROS';
            if (!grouped['OTROS']) grouped['OTROS'] = {};
        }
        if (!grouped[key][item.description]) {
            grouped[key][item.description] = { programmed: new Array(12).fill(0), executed: new Array(12).fill(0) };
        }
        let m = -1;
        if (item.date && typeof item.date === 'string' && item.date.includes('-')) {
            const parts = item.date.split('-');
            if (parts.length === 3) m = parseInt(parts[1]) - 1;
        }
        if (m === -1) {
            try {
                const d = new Date(item.date);
                if (!isNaN(d.getTime())) m = d.getMonth();
            } catch (e) { }
        }
        if (m >= 0 && m <= 11) grouped[key][item.description].programmed[m]++;
    });

    const descCache: any = {};
    for (const area in grouped) {
        for (const desc in grouped[area]) {
            const dNorm = normalize(desc);
            descCache[desc] = { norm: dNorm, words: getWords(dNorm) };
        }
    }

    const findMatch = (areaKey: string, searchStr: string) => {
        if (!grouped[areaKey]) return null;
        const tNorm = normalize(searchStr || '');
        const tWords = getWords(tNorm);
        if (tWords.length === 0) return null;

        return Object.keys(grouped[areaKey]).find(desc => {
            const cache = descCache[desc];
            if (!cache) return false;
            if (cache.norm === tNorm) return true;
            if (cache.words.length === 0) return false;
            return isSubset(cache.words, tWords) || isSubset(tWords, cache.words);
        });
    };

    executedInspections.forEach((exec: any) => {
        const m = getMonthFromStr(exec.date);
        if (m < 0 || m > 11 || !hasEvidence(exec)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, exec.inspectionType);
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    hhcRecords.forEach((hhc: any) => {
        const m = getMonthFromStr(hhc.date);
        if (m < 0 || m > 11 || !hasEvidence(hhc)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, hhc.tema);
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    evidenceRecords.forEach((ev: any) => {
        const objIdNum = targetObjId.replace('obj', '');
        const isEmoMatch = (targetObjId === 'obj5') && (ev.type?.toUpperCase() === 'EMO' || ev.category?.toUpperCase().includes('EMO'));
        const evObj = String(ev.objective || '').toUpperCase().replace(/\s+/g, '');
        const targetObjNorm = targetObjId.toUpperCase();
        const targetObjAlt = `OBJ${objIdNum.padStart(2, '0')}`;
        const isMatch = isEmoMatch || (ev.objective && (currentObjLabel.toUpperCase().includes(evObj) || evObj.includes(objIdNum) || evObj === targetObjNorm || evObj === targetObjAlt));
        if (!isMatch) return;
        const m = getMonthFromStr(ev.date);
        if (m < 0 || m > 11 || !hasEvidence(ev)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, ev.activity || ev.description || (isEmoMatch ? 'EMO' : ''));
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    pmaRecords.forEach((pma: any) => {
        if (targetObjId !== 'obj8') return;
        const m = getMonthFromStr(pma.date);
        if (m < 0 || m > 11 || !hasEvidence(pma)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, pma.category || pma.description);
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    atsRecords.forEach((ats: any) => {
        if (targetObjId === 'obj2') return;
        const m = getMonthFromStr(ats.date);
        if (m < 0 || m > 11 || !hasEvidence(ats)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, 'ATS' || ats.location);
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    petarRecords.forEach((petar: any) => {
        if (targetObjId === 'obj2') return;
        const m = getMonthFromStr(petar.date);
        if (m < 0 || m > 11 || !hasEvidence(petar)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, petar.type || 'PETAR');
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    detourRecords.forEach((det: any) => {
        if (targetObjId === 'obj2') return;
        const m = getMonthFromStr(det.date);
        if (m < 0 || m > 11 || !hasEvidence(det)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, det.category || 'Desvío');
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    simulacroRecords.forEach((sim: any) => {
        if (targetObjId !== 'obj10') return;
        const m = getMonthFromStr(sim.date);
        if (m < 0 || m > 11 || !hasEvidence(sim)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, sim.drillType || 'Simulacro');
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    brigadistaRecords.forEach((bri: any) => {
        if (targetObjId !== 'obj11') return;
        const m = getMonthFromStr(bri.date);
        if (m < 0 || m > 11 || !hasEvidence(bri)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, bri.brigadistaType || 'Brigadista');
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    risstmaRecords.forEach((ris: any) => {
        const m = getMonthFromStr(ris.date);
        if (m < 0 || m > 11 || !hasEvidence(ris)) return;
        for (const areaKey in grouped) {
            const match = findMatch(areaKey, ris.type || 'RISSTMA');
            if (match) grouped[areaKey][match].executed[m]++;
        }
    });

    reporteAcRecords.forEach((rac: any) => {
        const m = getMonthFromStr(rac.date);
        if (m < 0 || m > 11) return;
        for (const areaKey in grouped) {
            let match = null;
            if (targetObjId === 'obj4') {
                match = findMatch(areaKey, 'Reporte de actos y condiciones insegura') || findMatch(areaKey, 'Reporte de actos y condiciones') || findMatch(areaKey, 'Reporte');
            }
            if (!match) match = findMatch(areaKey, rac.acto || rac.condicion || 'A/C');
            if (match) {
                grouped[areaKey][match].executed[m] += (Number(rac.cantidad) || 1);
                break; // Stop searching other areas once matched, just like app/program/page.tsx does
            }
        }
    });

    const monthlyData = Array(12).fill(0).map((_, i) => ({ P: 0, E: 0 }));
    for (const areaKey in grouped) {
        for (const desc in grouped[areaKey]) {
            for (let m = 0; m < 12; m++) {
                monthlyData[m].P += grouped[areaKey][desc].programmed[m];
                monthlyData[m].E += grouped[areaKey][desc].executed[m];
            }
        }
    }

    return monthlyData;
};

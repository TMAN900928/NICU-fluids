alert("calculate() triggered");
function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const ageHours = Math.floor((now - dob) / 36e5);
  const day = Math.floor(ageHours / 24) + 1;

  const weight = parseFloat(document.getElementById('weight').value);
  const totalFluid = parseFloat(document.getElementById('fluid').value);
  const feedChoice = document.querySelector('input[name="feedTypeChoice"]:checked').value;
  const feedVol = parseFloat(document.getElementById('feedVolume').value) || 0;
  const feedInterval = parseInt(document.getElementById('feedInterval').value);
  const feedType = document.getElementById('feedTypeSelect').value;

  const pnSelect = document.getElementById('pnType');
  const starterOpt = pnSelect.querySelector('option[value="starter"]');
  if (day > 1 && starterOpt) pnSelect.removeChild(starterOpt);

  const proteinInput = parseFloat(document.getElementById('protein').value) || 0;
  const lipidInput = parseFloat(document.getElementById('lipidTarget').value) || 0;

  const pnData = {
    starter: { aa:3.3, gl:10, Na:3, K:0, Ca:1.4, Mg:0.25, Cl:0, Ac:0, Ph:1.5, TE:0.0, kcal:53.2 },
    maintenance: { aa:3.0, gl:10, Na:3, K:2, Ca:0.15, Mg:0.22, Cl:2, Ac:0, Ph:1.5, TE:0.74, kcal:52 },
    concentrated: { aa:3.8, gl:12.5, Na:4, K:2.7, Ca:0.15, Mg:0.25, Cl:2.7, Ac:1, Ph:1.5, TE:0.74, kcal:65.2 }
  };

  const feedData = {
    preterm_breastmilk:{kcal:74, carb:6.4, Na:17, K:29, Ca:74, Phos:67},
    preterm_formula:{kcal:80, carb:8.6, Na:14, K:41, Ca:77, Phos:67},
    mature_breastmilk:{kcal:70, carb:7.4, Na:6.4, K:35, Ca:15, Phos:8},
    standard_formula:{kcal:67, carb:7.5, Na:14, K:46, Ca:33, Phos:80}
  };

  const feedComp = feedData[feedType];
  let feedPerDay = feedChoice==='full' ? totalFluid*weight : (24/feedInterval)*feedVol;
  let feedPerKg = feedPerDay/weight;

  // caps by day
  const protCap = day===1?1:day===2?2:day===3?3:4;
  const lipidCap = day===1?6:day===2?12:18;

  const proteinTarget = Math.min(proteinInput, protCap);
  const lipidTarget = Math.min(lipidInput, lipidCap);
  const lipidVolume = lipidTarget / 0.178; // mL/kg/day

  if (feedChoice==='full') {
    const perFeed = (feedPerDay/8).toFixed(1);
    const GDR = (((feedPerDay/100) * feedComp.carb * 1000) / (weight * 1440)).toFixed(2);
    document.getElementById('results').innerHTML = `
      <h2>Full-Feed Summary (Day ${day})</h2>
      <p>Per 3‑hour feed: <strong>${perFeed} mL</strong></p>
      <p>Glucose Delivery Rate: <strong>${GDR} mg/kg/min</strong></p>`;
    return;
  }

  const GDRfeed = ((feedPerDay/100)*feedComp.carb*1000)/(weight*1440);
  const NaF = (feedComp.Na*feedPerKg)/1000;
  const KF = (feedComp.K*feedPerKg)/1000;
  const CaF = (feedComp.Ca*feedPerKg)/100;
  const PhF = (feedComp.Phos*feedPerKg)/100;

  const ivRate = parseFloat(document.getElementById('ivRate').value) || 0;
  const nacl = parseFloat(document.getElementById('nacl').value);
  const kcl = parseFloat(document.getElementById('kcl').value) || 0;
  const dext = parseFloat(document.getElementById('dextrose').value) || 0;

  const ivPerDay = ivRate*24;
  const ivPerKg = ivPerDay/weight;
  const NaIV = nacl*ivPerKg;
  const KIV = (kcl/1000)*(ivPerDay/weight);
  const GDRiv = (ivRate*dext)/(weight*6);

  const remFluid = totalFluid - feedPerKg - ivPerKg;
  const pnRate = Math.min((proteinTarget*weight*100)/(pnData[document.getElementById('pnType').value].aa*24), remFluid);
  const actualPNperDay = pnRate*24;
  const PNkg = actualPNperDay/weight;

  const comp = pnData[document.getElementById('pnType').value];
  const aa = (PNkg/100)*comp.aa;
  const glPN = (PNkg/100)*comp.gl;
  const GDRpn = (pnRate*comp.gl)/(weight*6);
  const NaPN = (PNkg/100)*comp.Na;
  const KPN = (PNkg/100)*comp.K;
  const CaPN = (PNkg/100)*comp.Ca;
  const MgPN = (PNkg/100)*comp.Mg;
  const AcPN = (PNkg/100)*comp.Ac;
  const PhPN = (PNkg/100)*comp.Ph;
  const ClPN = (PNkg/100)*comp.Cl;
  const TE = (PNkg/100)*comp.TE;

  const GDRtot = (GDRfeed+GDRiv+GDRpn).toFixed(2);
  const lipG = lipidTarget.toFixed(2);
  const lipVol = lipidVolume.toFixed(1);

  const totalDelivered = feedPerKg + ivPerKg + PNkg + lipidVolume;
  const fluidDef = totalDelivered<totalFluid;
  const suggestion = fluidDef ? `⚠️ Fluid shortfall — delivered ${totalDelivered.toFixed(1)} vs intended ${totalFluid}. Consider IV +${(((totalFluid-totalDelivered)*weight)/24).toFixed(1)} mL/hr` : '';

  document.getElementById('results').innerHTML = `
    <h2>Partial-Feed Summary (Day ${day})</h2>
    <p>Feed: ${feedPerKg.toFixed(1)} mL/kg/day</p>
    <p>PN: ${PNkg.toFixed(1)} mL/kg/day</p>
    <p>IV: ${ivPerKg.toFixed(1)} mL/kg/day</p>
    <p>Lipid: ${lipVol} mL/kg/day (${lipG} g/kg/day)</p>
    <p>Protein target/capped: ${proteinTarget} g/kg/day</p>
    <p>GDR: ${GDRtot} mg/kg/min</p>
    <h3>Electrolytes (mmol/kg/day)</h3>
    <p>Na: ${(NaF+NaIV+NaPN).toFixed(2)}</p>
    <p>K: ${(KF+KIV+KPN).toFixed(2)}</p>
    <p>Ca: ${(CaF+CaPN).toFixed(2)}</p>
    <p>Phos: ${(PhF+PhPN).toFixed(2)}</p>
    <p>Mg: ${MgPN.toFixed(2)}</p>
    <p>Acetate: ${AcPN.toFixed(2)}</p>
    <p>Cl: ${ClPN.toFixed(2)}</p>
    ${suggestion ? `<p class="warning">${suggestion}</p>` : ''}
  `;
}

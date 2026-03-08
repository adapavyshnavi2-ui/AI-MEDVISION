let symptoms = [];
let locationStr = "GPS: Not Available";
let rawCoords = { lat: 0, lon: 0 };
let currentLang = 'en-IN'; 
let recognition = null; 

// 🔊 AUDIO SYSTEM
const emergencySiren = new Audio('siren.mp3'); 
emergencySiren.loop = true; 

// 📍 HIGH-PRECISION LOCATION
navigator.geolocation.getCurrentPosition(p => {
    rawCoords.lat = p.coords.latitude;
    rawCoords.lon = p.coords.longitude;
    locationStr = `${rawCoords.lat.toFixed(5)},${rawCoords.lon.toFixed(5)}`;
}, () => { 
    locationStr = "GPS: Denied"; 
}, { enableHighAccuracy: true });

// 🌐 MULTILINGUAL LOGIC
function changeLang(lang) {
    currentLang = lang;
    haptic('success');
    window.speechSynthesis.cancel();
    
    let msg = (lang === 'te-IN') ? "తెలుగు భాష సెట్ చేయబడింది" : 
              (lang === 'hi-IN') ? "हिंदी भाषा सक्रिय है" : "English language activated";
    
    if (lang === 'te-IN') updateUIForLang("మాట్లాడండి", "🚑 అంబులెన్స్ కాల్", "విశ్లేషణ ప్రారంభించండి");
    else if (lang === 'hi-IN') updateUIForLang("बात करने के लिए टैप करें", "🚑 एम्बुलेंस कॉल", "विश्लेषण शुरू करें");
    else updateUIForLang("🎤 Tap to Speak", "🚑 Call Ambulance (108)", "🧠 Start AI Analysis");
    
    speakResult(msg);
}

function updateUIForLang(voiceText, scanText, analyzeText) {
    const startBtn = document.getElementById("start-btn");
    const scanBtn = document.getElementById("scan-btn-main");
    const analyzeBtn = document.getElementById("analyze-btn");
    if(startBtn) startBtn.innerText = voiceText;
    if(scanBtn) scanBtn.innerText = scanText;
    if(analyzeBtn) analyzeBtn.innerText = analyzeText;
}

// 🎤 VOICE CONSULTATION
const startBtn = document.getElementById("start-btn");
if (startBtn) {
    startBtn.onclick = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("❌ Your browser doesn't support Speech.");
            return;
        }
        if (recognition) { try { recognition.stop(); } catch(e) {} }

        recognition = new SpeechRecognition();
        recognition.lang = currentLang;
        haptic('success');
        startBtn.innerText = "Listening... 🎤";
        startBtn.style.background = "#ff1744"; 

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            symptoms.push(transcript);
            updateChips();
            speakResult(currentLang === 'en-IN' ? "Added " + transcript : "చేర్చబడింది " + transcript);
        };
        recognition.onend = () => resetVoiceUI();
        try { recognition.start(); } catch (e) { resetVoiceUI(); }
    };
}

function resetVoiceUI() {
    if (!startBtn) return;
    startBtn.innerText = (currentLang === 'te-IN') ? "మాట్లాడండి" : 
                        (currentLang === 'hi-IN') ? "बात करने के लिए टैप करें" : "🎤 Tap to Speak";
    startBtn.style.background = ""; 
}

// 🆘 EMERGENCY SYSTEM
function triggerGlobalEmergency(reason = "Medical Emergency") {
    haptic('panic');
    emergencySiren.play().catch(() => {});
    document.body.classList.add('emergency-flash');
    let confirmMsg = (currentLang === 'te-IN') ? "🚨 అత్యవసర పరిస్థితి! SOS ని సక్రియం చేయాలా?" : 
                     (currentLang === 'hi-IN') ? "🚨 आपातकालीन स्थिति! क्या SOS सक्रिय करें?" : 
                     `🚨 RISK ALERT: ${reason.toUpperCase()}! Activate SOS?`;
    if (confirm(confirmMsg)) {
        sendSOSMessage(reason);
        setTimeout(() => callAmbulance(), 1500); 
    } else { stopEmergencySiren(); }
}

function stopEmergencySiren() {
    emergencySiren.pause();
    emergencySiren.currentTime = 0;
    document.body.classList.remove('emergency-flash');
}

function sendSOSMessage(reason) {
    const contactNumber = "108"; 
    const mapsLink = `https://www.google.com/maps?q=${rawCoords.lat},${rawCoords.lon}`;
    const messageBody = `🆘 EMERGENCY SOS\nReason: ${reason}\nLoc: ${locationStr}\nMap: ${mapsLink}`;
    window.location.href = `sms:${contactNumber}?body=${encodeURIComponent(messageBody)}`;
}

function callAmbulance() { window.location.href = "tel:108"; }

// 🔦 FEATURE: SOS MORSE CODE FLASHLIGHT
let isFlashing = false;

async function toggleSOSFlashlight() {
    const btn = document.getElementById('flash-btn');
    if (isFlashing) {
        isFlashing = false;
        btn.innerHTML = "🔦 Morse SOS Light";
        btn.style.background = "#4527a0";
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const track = stream.getVideoTracks()[0];
        isFlashing = true;
        btn.innerHTML = "🛑 Stop SOS Light";
        btn.style.background = "#ff1744";

        const pattern = [200,200, 200,200, 200,600, 600,200, 600,200, 600,600, 200,200, 200,200, 200,1000];
        let step = 0;

        const flash = async () => {
            if (!isFlashing) {
                track.applyConstraints({ advanced: [{ torch: false }] });
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            const isOn = step % 2 === 0;
            await track.applyConstraints({ advanced: [{ torch: isOn }] });
            setTimeout(() => {
                step = (step + 1) % pattern.length;
                flash();
            }, pattern[step]);
        };
        flash();
    } catch (e) { alert("Flashlight access denied or not supported."); }
}

// 📚 FEATURE: OFFLINE FIRST-AID GUIDES
const firstAidData = {
    "Snake Bite": "1. Keep calm. 2. Immobilize the limb. 3. Keep bite below heart level. 4. Clean with water. 5. DO NOT suck venom.",
    "Heat Stroke": "1. Move to shade. 2. Cool with water/ice packs on neck/armpits. 3. Sip water slowly.",
    "Severe Bleeding": "1. Apply direct pressure with clean cloth. 2. Elevate wound. 3. Do not remove soaked cloth.",
    "Choking": "1. 5 back blows. 2. 5 abdominal thrusts (Heimlich). 3. Repeat until clear."
};

function showFirstAid() {
    const modal = document.getElementById('first-aid-modal');
    const content = document.getElementById('first-aid-content');
    modal.style.display = "block";
    content.innerHTML = Object.keys(firstAidData).map(key => `
        <div style="background:#222; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid var(--primary);">
            <h4 style="margin:0; color:var(--primary);">${key}</h4>
            <p style="font-size:14px; color:#ccc;">${firstAidData[key]}</p>
        </div>`).join('');
}

function closeFirstAid() { document.getElementById('first-aid-modal').style.display = "none"; }

// ⌨️ INPUT METHODS
function addTextSymptom() {
    const input = document.getElementById("text-input");
    if (!input || !input.value.trim()) return;
    symptoms.push(input.value.trim());
    updateChips();
    input.value = "";
    haptic('success');
}

function addIconSymptom(name) {
    symptoms.push(name);
    updateChips();
    haptic('success');
}

function removeSymptom(index) {
    symptoms.splice(index, 1);
    updateChips();
}

// 🧠 LOCAL AI ANALYSIS
const analyzeBtn = document.getElementById("analyze-btn");
if(analyzeBtn) analyzeBtn.onclick = () => {
    if (symptoms.length === 0) return alert("Please add symptoms first!");
    const resultArea = document.getElementById("result");
    resultArea.innerHTML = `<div class="loader-container"><div class="heart-pulse">❤️</div><p>Scanning Risks...</p></div>`;
    
    setTimeout(() => {
        const symptomsStr = symptoms.join(" ").toLowerCase();
        let severity = "LOW";
        let analysis = "Assessment complete. No immediate life-threatening risks detected.";

        if (symptomsStr.includes("chest") || symptomsStr.includes("breath") || symptomsStr.includes("unconscious")) {
            severity = "EMERGENCY";
            analysis = "🚨 CRITICAL: High risk detected. Seek immediate help!";
        } else if (symptomsStr.includes("fever") || symptomsStr.includes("pain")) {
            severity = "MEDIUM";
            analysis = "⚠️ MODERATE: Symptoms require medical attention.";
        }

        renderResult({ severity, analysis, hospital: "Nearest Emergency Hospital", h_phone: "108" });
    }, 1500); 
};

// 📊 RENDERING RESULTS
function renderResult(data) {
    const resultArea = document.getElementById("result");
    const severity = data.severity || "LOW";
    
    if (severity === "EMERGENCY") triggerGlobalEmergency("Critical Symptoms Detected");
    else stopEmergencySiren();

    const mapSearchUrl = `https://www.google.com/maps/search/hospital/@${rawCoords.lat},${rawCoords.lon},14z`;

    resultArea.innerHTML = `
        <div class="glass-card result-card ${severity.toLowerCase()}">
            <h3 style="margin:0;">📋 Analysis: ${severity}</h3>
            <p style="line-height:1.6; margin: 15px 0;">${data.analysis}</p>
            <div id="emergency-hub" style="display: flex; flex-direction: column; background: white; padding: 15px; border-radius: 12px; border: 1px solid #ddd; text-align: center; gap: 10px;">
                <p style="color: black; font-weight: 800; font-size: 1.1em; margin: 0;">🏥 ${data.hospital}</p>
                <button class="emergency-btn" style="background:#d32f2f; color:white;" onclick="window.location.href='tel:${data.h_phone}'">📞 Call 108</button>
                <button class="emergency-btn" style="background:#10b981; color:white;" onclick="window.open('${mapSearchUrl}', '_blank')">📍 Start Navigation</button>
                <button class="emergency-btn" style="background:#1a237e; color:white;" onclick="generateMedicQR()">📲 Generate Medic QR</button>
                <div id="qrcode-container" style="display:none; margin-top:10px; padding:10px; background:white; align-self:center;"></div>
            </div>
        </div>`;
    speakResult(data.analysis);
}

function generateMedicQR() {
    const container = document.getElementById("qrcode-container");
    container.innerHTML = "";
    container.style.display = "block";
    const medicData = `VITALS-AI\nSev: ${symptoms.length > 0 ? 'Review' : 'Low'}\nSymp: ${symptoms.join(', ')}\nGPS: ${locationStr}`;
    new QRCode(container, { text: medicData, width: 150, height: 150 });
    haptic('success');
}

function clearAllData() {
    symptoms = []; 
    updateChips(); 
    document.getElementById("result").innerHTML = `<p style="text-align:center; color:#94a3b8; margin-top:50px;">📉 No active analysis.</p>`;
    stopEmergencySiren();
    haptic('success');
}

function updateChips() {
    const chipContainer = document.getElementById("symptoms-chips");
    if(chipContainer) {
        chipContainer.innerHTML = symptoms.map((s, i) => `<span class="chip" onclick="removeSymptom(${i})">${s} ✕</span>`).join("");
    }
}

function speakResult(text) {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = (currentLang === 'te-IN') ? 'te-IN' : (currentLang === 'hi-IN') ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(speech);
}

function haptic(type) {
    if (!navigator.vibrate) return;
    type === 'panic' ? navigator.vibrate([500, 200, 500, 200, 500]) : navigator.vibrate(40);
}

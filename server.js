const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();

const upload = multer({ dest: 'uploads/' });
const DB_FILE = path.join(__dirname, 'waitingList.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 데이터 로드
let waitingList = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : [];
let settings = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE)) : {
    title: "신앙학교 신청 시스템",
    waitingDate: "",
    startTime: "",
    endTime: "",
    capacity: 50,
    isOpen: true,
    logoUrl: ""
};

function saveAll() {
    fs.writeFileSync(DB_FILE, JSON.stringify(waitingList, null, 2));
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// API
app.get('/api/settings', (req, res) => res.json(settings));
app.post('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    saveAll();
    res.json({ success: true });
});

app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
    settings.logoUrl = '/uploads/' + req.file.filename;
    saveAll();
    res.json({ path: settings.logoUrl });
});

app.get('/api/waiting', (req, res) => res.json({ waitingList, settings }));

app.post('/api/waiting', (req, res) => {
    const { phone, isPreRegistered } = req.body;
    const existingIndex = waitingList.findIndex(i => i.phone === phone && i.isPreRegistered === true);
    
    if (existingIndex !== -1 && isPreRegistered === false) {
        waitingList[existingIndex] = { ...waitingList[existingIndex], ...req.body, created_at: new Date().toLocaleString() };
    } else {
        waitingList.push({ id: Date.now(), ...req.body, created_at: new Date().toLocaleString() });
    }
    saveAll();
    res.json({ success: true });
});

app.post('/api/delete-patient', (req, res) => {
    waitingList = waitingList.filter(i => i.id !== req.body.id);
    saveAll();
    res.json({ success: true });
});

app.post('/api/reset', (req, res) => {
    waitingList = [];
    saveAll();
    res.json({ success: true });
});

// 기존 코드 맨 아래를 이렇게 변경하세요
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});
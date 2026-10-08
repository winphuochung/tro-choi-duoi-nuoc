/**
 * ============================================================
 *  APPS SCRIPT WEB APP — Nền tảng "An Toàn Dưới Nước"
 * ============================================================
 *  Backend Google Sheet cho game game_01_Bat_dau.html
 *  - doGet(action=pull)   : tải toàn bộ dữ liệu (câu hỏi + điểm + cài đặt + học sinh)
 *  - doGet(action=test)   : kiểm tra kết nối (ping)
 *  - doGet(action=setup)  : tạo 4 tab + header nếu chưa có
 *  - doPost({action:'push_scores', records:[...]}) : ghi điểm mới
 *
 *  Dữ liệu chia thành 4 tab:
 *    1. Cau_Hoi      : ngân hàng câu hỏi
 *    2. Hoc_Sinh     : danh sách học sinh
 *    3. Lich_Su_Diem : lịch sử từng lượt chơi (bảng xếp hạng)
 *    4. Cai_Dat      : cài đặt trò chơi (key/value)
 *
 *  CÀI ĐẶT:
 *    1) Mở Google Sheets mới -> Extensions -> Apps Script
 *    2) Dán toàn bộ file này vào Code.gs (thay nội dung có sẵn)
 *    3) Chạy hàm setup() một lần để tạo 4 tab + dữ liệu mẫu
 *       (chọn setup trong thanh dropdown rồi bấm Run, cấp quyền)
 *    4) Deploy -> New deployment -> Web app
 *         - Execute as : Me
 *         - Who has access : Anyone  (BẮT BUỘC để game gọi được)
 *    5) Copy URL Web App (kết thúc bằng /exec) vào tab ⚙ Quản trị
 *       của game, mục "Google Sheet".
 * ============================================================
 */

// ------------------------------------------------------------
// Hằng số cấu hình
// ------------------------------------------------------------
var SHEETS = {
  CAU_HOI : 'Cau_Hoi',
  HOC_SINH: 'Hoc_Sinh',
  LICH_SU : 'Lich_Su_Diem',
  CAI_DAT : 'Cai_Dat'
};

// Header các tab (phải khớp thứ tự ghi/trả về)
var HEADERS = {
  CAU_HOI : ['id','text','image','emoji','options','correct','explain'],
  HOC_SINH: ['id','name','avatar'],
  LICH_SU : ['id','studentId','name','avatar','stars','combo','timeMs','at'],
  CAI_DAT : ['key','value']
};

// Cài đặt mặc định (khớp state.settings của game)
var WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwcs94Mq-B1V3MUAM6C64HX4wYOPZ6aEU36nX64Gf5e9clYBxofirPRXJBUZX2YX6MQoQ/exec';

var DEFAULT_SETTINGS = {
  gameTitle    : 'Phòng Tránh Đuối Nước Cho Bé',
  questionsCount: 10,
  countdown    : true,
  seconds      : 30,
  pin          : 'MN2026',
  sound        : true,
  autoPush     : true,
  ttsRate      : 0.9,
  ttsVoice     : '',
  gsUrl        : WEB_APP_URL
};

// Học sinh mẫu
var DEFAULT_STUDENTS = [
  { id:'s1', name:'Bé Lan',  avatar:'🦊' },
  { id:'s2', name:'Bé Minh', avatar:'🐯' },
  { id:'s3', name:'Bé An',   avatar:'🐼' }
];

// 5 câu hỏi mẫu (khớp DEFAULT_QUESTIONS của game)
var DEFAULT_QUESTIONS = [
  {
    id:'q1',
    text:'Khi đi học về, bé phải đi cùng ai?',
    image:'img/q1_be_boi.webp', emoji:'🐯',
    options:['Đi cùng bố mẹ / người lớn','Một mình xuống nước','Cùng bạn nhỏ 3 tuổi','Đợi bạn tình cờ một mình'],
    correct:0,
    explain:'Bé chưa thể tự bơi an toàn. Luôn luôn phải đi cùng bố mẹ hoặc người lớn, huân luyện viên trường nom cảnh sát khi bé ở trong nước. Không bao giờ để bé xuống nước một mình.'
  },
  {
    id:'q2',
    text:'Khi đi tàu, thuyền hoặc chơi dưới nước, bé phải mặc gì?',
    image:'img/q2_aophao.jpg', emoji:'🦺',
    options:['Áo phao cứu sinh','Áo dài của bà','Váy tay mềm','Giày bata'],
    correct:0,
    explain:'Áo phao cứu sinh giúp bé nổi trên mặt nước khi ngâ xuống, là bộ dùng hình không thể thiếu khi đi tàu, thuyền hay chơi ở sông. Áo phao phải vừa vón và được người lớn giúp đeo.'
  },
  {
    id:'q3',
    text:'Nhận thấy ao hồ, sông suối, bé có được tự ý nhảy xuống không?',
    image:'img/q3_camta.jpg', emoji:'⚠️',
    options:['Tuyệt đối không','Có nếu nhảy thật nhanh','Có nếu có bạn đi cùng','Có nếu trời trời mát'],
    correct:0,
    explain:'Ao hồ, sông suối rất nguy hiểm: nước sâu, chảy xiết, có thể bị tràn trợt và không có ai cứu. Dù giải câu nào, bé cũng KHÔNG được tự nhảy xuống khi chưa có người lớn cho phâp.'
  },
  {
    id:'q4',
    text:'Thằng nước, xa nước trong nhà phải làm sao?',
    image:'img/q4_chautam.webp', emoji:'🐼',
    options:['Đậy nắp kín thật chặc','Để nước thật đầy','Mấy vung cho thoáng','Để ở nơi bé đủ với'],
    correct:0,
    explain:'Ngay cả một thằng nước đầy cũng có thể làm bé nhỏ ngâ vào và ngột. Thằng, xa, can nước phải luôn đậy nắp và để ở nơi cao, xa tầm với của trẻ em.'
  },
  {
    id:'q5',
    text:'Thấy bạn nhỏ ngâ xuống nước, bé làm gì?',
    image:'img/q5_cuu.jpg', emoji:'🐯',
    options:['Hâo to gọi người lớn cứu giâp','Nhây xuống kéo bạn lên','Gâo kéo tác bạn lên','Để bạn tâ leo lên bờ'],
    correct:0,
    explain:'Bé nhỏ không được nhảy xuống nước cứu bạn và rất nguy hiểm. Việc âng lă hâo to gọi người lớn ân cứu, và có thể nắm dâi nhâ phao, dây thâng, khắc gâ cho bạn bâm lăy.'
  }
];

// ------------------------------------------------------------
// HELPERS — đọc / viết Sheet
// ------------------------------------------------------------
function getSS_(){
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name, createIfMissing){
  var ss = getSS_();
  var sh = ss.getSheetByName(name);
  if (!sh && createIfMissing){
    sh = ss.insertSheet(name);
  }
  return sh;
}

function getRows_(sheetName){
  var sh = getSheet_(sheetName, false);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var header = data.shift(); // bỏ dòng header
  var rows = [];
  for (var i = 0; i < data.length; i++){
    if (data[i][0] === '' || data[i][0] === null) continue; // bỏ hàng trống
    var obj = {};
    for (var j = 0; j < header.length; j++){
      obj[header[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function clearAndWrite_(sheetName, header, records){
  var sh = getSheet_(sheetName, true);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, header.length).clearContent();
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  if (records.length){
    var matrix = records.map(function(r){
      return header.map(function(h){
        var v = r[h];
        if (h === 'options') v = JSON.stringify(v || []);   // lưu mảng dưới dạng JSON
        return (v === undefined || v === null) ? '' : v;
      });
    });
    sh.getRange(2, 1, matrix.length, header.length).setValues(matrix);
  }
  sh.setFrozenRows(1);
}

// ------------------------------------------------------------
// ĐỌC DỮ LIỆU (biến row Sheet -> object JS)
// ------------------------------------------------------------
function readQuestions_(){
  var rows = getRows_(SHEETS.CAU_HOI);
  return rows.map(function(r){
    var opts = [];
    try { opts = JSON.parse(r.options || '[]'); } catch(e){ opts = []; }
    return {
      id     : String(r.id),
      text   : r.text || '',
      image  : r.image || '',
      emoji  : r.emoji || '',
      options: opts,
      correct: parseInt(r.correct, 10) || 0,
      explain: r.explain || ''
    };
  });
}

function readStudents_(){
  var rows = getRows_(SHEETS.HOC_SINH);
  return rows.map(function(r){
    return { id:String(r.id), name:r.name||'', avatar:r.avatar||'' };
  });
}

function readScores_(){
  var rows = getRows_(SHEETS.LICH_SU);
  return rows.map(function(r){
    return {
      id       : String(r.id),
      studentId: String(r.studentId),
      name     : r.name || '',
      avatar   : r.avatar || '',
      stars    : parseInt(r.stars, 10) || 0,
      combo    : parseInt(r.combo, 10) || 0,
      timeMs   : parseInt(r.timeMs, 10) || 0,
      at       : parseInt(r.at, 10) || 0
    };
  });
}

function readSettings_(){
  var rows = getRows_(SHEETS.CAI_DAT);
  var out = Object.assign({}, DEFAULT_SETTINGS);
  rows.forEach(function(r){
    var k = r.key, v = r.value;
    if (k === 'countdown' || k === 'sound' || k === 'autoPush'){
      out[k] = (String(v) === 'true' || v === true);
    } else if (k === 'questionsCount' || k === 'seconds'){
      out[k] = parseInt(v, 10);
    } else if (k === 'ttsRate'){
      out[k] = parseFloat(v);
    } else {
      out[k] = v;
    }
  });
  return out;
}

function writeSettings_(settings){
  // Normalize settings -> array of {key, value} (hỗ trợ cả object flat lẫn array)
  var records;
  if (Array.isArray(settings)){
    records = settings;
  } else if (settings && typeof settings === 'object'){
    records = Object.keys(settings).map(function(k){
      return { key: k, value: settings[k] };
    });
  } else {
    records = [];
  }
  var header = HEADERS.CAI_DAT;
  clearAndWrite_(SHEETS.CAI_DAT, header, records);
}

// ------------------------------------------------------------
// SEED dữ liệu mẫu (chạy 1 lần qua setup())
// ------------------------------------------------------------
function setup(){
  var ss = getSS_();
  // Xoá 1 tab "Sheet1" mặc định nếu trống
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length === 1 && def.getLastRow() === 0){
    ss.deleteSheet(def);
  }
  clearAndWrite_(SHEETS.CAU_HOI,  HEADERS.CAU_HOI,  DEFAULT_QUESTIONS);
  clearAndWrite_(SHEETS.HOC_SINH,  HEADERS.HOC_SINH,  DEFAULT_STUDENTS);
  clearAndWrite_(SHEETS.LICH_SU,   HEADERS.LICH_SU,   []);
  writeSettings_(DEFAULT_SETTINGS);
  SpreadsheetApp.getUi
    ? SpreadsheetApp.getUi().alert('✅ Đã tạo 4 tab + dữ liệu mẫu. Giờ Deploy -> Web app -> Access: Anyone.')
    : Logger.log('Setup complete.');
  return 'OK';
}

// ------------------------------------------------------------
// WEB APP ENTRIES
// ------------------------------------------------------------
function doGet(e){
  var action = (e && e.parameter && e.parameter.action) || 'pull';
  var out;

  if (action === 'test'){
    out = { ok:true, service:'AnToanDuoiNuoc', time:new Date().toISOString(), message:'Web app đang hoạt động ✅' };

  } else if (action === 'setup'){
    try { setup(); out = { ok:true, message:'Đã tạo/seed lại dữ liệu.' }; }
    catch(err){ out = { ok:false, error:err.message }; }

  } else { // pull (mặc định)
    out = {
      questions : readQuestions_(),
      students  : readStudents_(),
      scores    : readScores_(),
      settings  : readSettings_(),
      _meta     : { service:'AnToanDuoiNuoc', time:new Date().toISOString() }
    };
  }

  return jsonOut_(out);
}

function doPost(e){
  var body, action, records;
  try {
    body = JSON.parse(e.postData.contents || '{}');
  } catch (err) {
    return jsonOut_({ ok:false, error:'Body JSON không hợp lệ: ' + err.message });
  }
  action = body.action;

  if (action === 'push_scores'){
    records = (body.records || []).filter(function(r){ return r && r.id; });
    if (records.length === 0){
      return jsonOut_({ ok:true, message:'Không có điểm mới để ghi.' });
    }
    // Gộp (upsert) theo id để không trùng khi push nhiều lần
    var header = HEADERS.LICH_SU;
    var existing = {};
    getRows_(SHEETS.LICH_SU).forEach(function(r){ existing[r.id] = r; });
    var all = getRows_(SHEETS.LICH_SU).map(function(r){
      r.stars  = parseInt(r.stars, 10) || 0;
      r.combo  = parseInt(r.combo, 10) || 0;
      r.timeMs = parseInt(r.timeMs, 10) || 0;
      r.at     = parseInt(r.at, 10) || 0;
      return r;
    });
    records.forEach(function(rec){
      if (existing[rec.id]) return; // đã tồn tại -> bỏ qua (mỗi lượt chơi 1 id)
      all.push(rec);
    });
    clearAndWrite_(SHEETS.LICH_SU, header, all);
    return jsonOut_({ ok:true, message:'Đã ghi ' + records.length + ' lượt chơi mới.' });

  } else if (action === 'push_all'){
    // Ghi đồng bộ toàn bộ (câu hỏi + học sinh + điểm + cài đặt)
    if (body.questions) clearAndWrite_(SHEETS.CAU_HOI,  HEADERS.CAU_HOI,  body.questions);
    if (body.students)  clearAndWrite_(SHEETS.HOC_SINH,  HEADERS.HOC_SINH,  body.students);
    if (body.scores)    clearAndWrite_(SHEETS.LICH_SU,   HEADERS.LICH_SU,   body.scores);
    if (body.settings)  writeSettings_(body.settings);
    return jsonOut_({ ok:true, message:'Đã đồng bộ toàn bộ dữ liệu.' });

  } else {
    return jsonOut_({ ok:false, error:'Hàm action không rõ: ' + action });
  }
}

// ------------------------------------------------------------
// Trả JSON (trả Content-Type đúng để fetch(...).json() đọc được)
// ------------------------------------------------------------
function jsonOut_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

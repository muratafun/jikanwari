
  let timetableData = {};

  let selectableSubjects = [];
  let creditMap = {};

  Promise.all([
	  fetch('data/timetable.json').then(res => res.json()),
	  fetch('data/selectableSubjects.json').then(res => res.json())
  ])
    .then(([timetable, selectables]) => {
    	timetableData = timetable;
		selectableSubjects = selectables;
    creditMap = timetable.creditMap || {};
		setupListeners();
      	updateSubject();
	})
    .catch(error =>{
		console.error("読み込みエラー", error);
	});

  function setupListeners() {
    document.getElementById('year').addEventListener('change', updateSubject);
    document.getElementById('class').addEventListener('change', updateSubject);
    document.getElementById('course').addEventListener('change', updateSubject);
  }

  function updateSubject() {
    const year = document.getElementById('year').value;
    const course = document.getElementById('course').value;
    const selectedClass = document.getElementById('class').value;
    const days = ["mon", "tue", "wed", "thu", "fri"];
    const periods = [1, 2, 3, 4, 5];

    for (const day of days) {
      for (const period of periods) {
        const cellId = `${day}${period}`;
        const cell = document.getElementById(cellId);
        const isSelectable = selectableSubjects.some(item => item.dayperiod === cellId && item.classes.includes(selectedClass));
        if (cell) {
          if (isSelectable) {
            cell.innerHTML = "";
          } else {
            cell.textContent = "未設定";
          }
        }
      }
    }

    const yearData = timetableData[year]?.[course];
    if (!yearData) return;

    for (const group in yearData) {
      const groupData = yearData[group];
      if (!groupData.classes || !groupData.classes.includes(selectedClass)) continue;

      for (const key in groupData) {
        if (key === "classes") continue;

        const isSelectable = selectableSubjects.some(item =>
          item.dayperiod === key && item.classes.includes(selectedClass)
        );
        if (isSelectable) continue;

        const cell = document.getElementById(key);
        if (cell) cell.textContent = groupData[key];
      }
    }

    for (const item of selectableSubjects) {
      if (!item.classes.includes(selectedClass)) continue;

      const cell = document.getElementById(item.dayperiod);
      if (!cell) continue;

      const selectHTML = `
        <select onchange="handleSelectChange(event, '${item.dayperiod}', ${JSON.stringify(item.options)})">
          ${item.options.map(opt => `<option value="${opt}">${opt || '選択してください'}</option>`).join('')}
        </select>
      `;
      cell.innerHTML = selectHTML;
    }
  }

  function handleSelectChange(event, cellId, options) {
    const selected = event.target.value;
    const cell = document.getElementById(cellId);

    if (selected) {
      cell.textContent = selected;

      // 他のリンクセルも変更
      for (const link of linkedSubjects) {
        if (link.subject === selected && link.dayperiods.includes(cellId)) {
          for (const dp of link.dayperiods) {
            const linkedCell = document.getElementById(dp);
            if (!linkedCell) continue;
            if (dp === cellId) continue;
            linkedCell.textContent = selected;
          }
        }
      }
    } else {
      cell.innerHTML = `
        <select onchange="handleSelectChange(event, '${cellId}', ${JSON.stringify(options)})">
          ${options.map(opt => `<option value="${opt}">${opt || '選択してください'}</option>`).join('')}
        </select>
      `;
    }
  }

  const recommendationModels = {
  "1_A": {
    credits: 24,
    timetable: [
      ["解析学２", "数学総合演習２", "プログラミング基礎", "", "データサイエンス入門"],
      ["線形代数学２", "", "プログラミング基礎", "", "ブレインサイエンス"],
      ["社会思想の歩み", "Communication2", "プログラミング基礎", "Communication2", ""],
      ["VEP2", "社会と経済の把握", "情報数学", "", ""],
      ["", "", "", "", ""]
    ]
  },
  "1_E": {
    credits: 24,
    timetable: [
      ["解析学２", "", "", "線形代数学２", "データサイエンス入門"],
      ["環境と産業", "", "", "数学総合演習２", "ブレインサイエンス"],
      ["社会思想の歩み", "情報数学", "プログラミング基礎", "", "発達と学習"],
      ["VEP2", "Communication2", "プログラミング基礎", "Communication2", ""],
      ["", "", "プログラミング基礎", "情報産業論", ""]
    ]
  }
};

    function showRecommendation() {
      const year = document.getElementById('year').value;
      const classVal = document.getElementById('class').value;
      const key = `${year}_${classVal}`;
      const area = document.getElementById('recommendationArea');

      if (!recommendationModels[key]) {
        area.innerHTML = '<p>この学年・クラスに対する履修提案はまだ登録されていません。</p>';
        return;
      }

      const model = recommendationModels[key];
const timetable = model.timetable;
let html = `<h2>このような履修例はいかがですか？（合計 ${model.credits} 単位）</h2>`;
html += '<table border="1">';
html += '<tr><th></th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th></tr>';
for (let i = 0; i < 5; i++) {
  html += `<tr><td>${i+1}</td>`;
  for (let j = 0; j < 5; j++) {
    html += `<td>${timetable[i][j]}</td>`;
  }
  html += '</tr>';
}
html += '</table>';

      area.innerHTML = html;
    }


  function confirmSchedule() {
  const days = ["mon", "tue", "wed", "thu", "fri"];
  const periods = [1, 2, 3, 4, 5];
  const selectedClass = document.getElementById("class").value;
  const container = document.getElementById("confirmedScheduleContainer");
  container.innerHTML = ""; // 一旦リセット

  // コミュニケーション論の選択確認
  const tue2Cell = document.getElementById("tue2");
  const fri5Cell = document.getElementById("fri5");

  const tue2Value = tue2Cell.querySelector("select") ? tue2Cell.querySelector("select").value : tue2Cell.textContent.trim();
  const fri5Value = fri5Cell.querySelector("select") ? fri5Cell.querySelector("select").value : fri5Cell.textContent.trim();

  const hasOneComm = 
    (tue2Value === "3Q:コミュニケーション論" && (!fri5Value || fri5Value === "未選択" || fri5Value === ""))
    || (fri5Value === "3Q:コミュニケーション論" && (!tue2Value || tue2Value === "未選択" || tue2Value === ""));

  if (hasOneComm) {
    container.innerHTML = `<p style="color:red; font-weight:bold;">もう片方のコミュニケーション論を選択してください</p>`;
    return; // 表を表示せず終了
  }

  // 時間割表のHTML生成
  let tableHTML = `<h2>${selectedClass}クラスの確定時間割</h2><table border="1"><tr><th></th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th></tr>`;

  for (const period of periods) {
    tableHTML += `<tr><td>${period}</td>`;
    for (const day of days) {
      const cellId = `${day}${period}`;
      const cell = document.getElementById(cellId);
      let value = "";

      if (cell.querySelector("select")) {
        value = cell.querySelector("select").value;
        if (!value || value === "") {
          value = "未選択";
        }
      } else {
        value = cell.textContent.trim() || "未設定";
      }

      tableHTML += `<td>${value}</td>`;
    }
    tableHTML += `</tr>`;
  }

  tableHTML += `</table>`;
  container.innerHTML = tableHTML;
  
  // 単位数集計処理
  let totalCredits = 0;
  const countedSubjects = new Set(); // 重複登録防止

  for (const period of periods) {
    for (const day of days) {
      const cellId = `${day}${period}`;
      const cell = document.getElementById(cellId);
      let value = "";

      if (cell.querySelector("select")) {
        value = cell.querySelector("select").value;
      } else {
        value = cell.textContent.trim();
      }

      if (creditMap[value] && !countedSubjects.has(value)) {
        totalCredits += creditMap[value];
        countedSubjects.add(value);
      }
    }
  }

 // 単位を計算した科目一覧を表示用に変換
const subjectsList = Array.from(countedSubjects).join(", ");

// 合計単位数と科目名の両方を表示
tableHTML += `<p><strong>合計単位数：</strong> ${totalCredits} 単位</p>`;
tableHTML += `<p><strong>対象科目：</strong> ${subjectsList}</p>`;

container.innerHTML = tableHTML;


}


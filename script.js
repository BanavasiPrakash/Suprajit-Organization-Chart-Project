let originalData = [];
let lastData = [];

// === File Upload ===
document.getElementById('submitBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('upload');
  if (!fileInput.files[0]) {
    alert("Please choose a file first.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    originalData = sheet;

    drawChart(originalData);
    lastData = originalData;

    document.getElementById('chart_div').style.display = 'block';
    document.getElementById('search').style.display = 'inline-block';
    document.getElementById('refreshBtn').style.display = 'inline-block';
    document.getElementById('backBtn').style.display = 'inline-block';
    document.getElementById('printBtn').style.display = 'inline-block';

    document.getElementById('file-controls').style.display = 'none';
    document.getElementById('page-title').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('logo-image').style.display = 'none';
  };
  reader.readAsArrayBuffer(fileInput.files[0]);
});

document.getElementById('clearBtn').addEventListener('click', () => {
  location.reload();
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  document.getElementById('search').value = '';
  drawChart(originalData);
  lastData = originalData;
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('chart_div').style.display = 'none';
  document.getElementById('search').style.display = 'none';
  document.getElementById('refreshBtn').style.display = 'none';
  document.getElementById('backBtn').style.display = 'none';
  document.getElementById('printBtn').style.display = 'none';

  document.getElementById('file-controls').style.display = 'flex';
  document.getElementById('page-title').style.display = 'block';
  document.getElementById('instructions').style.display = 'block';
  document.getElementById('logo-image').style.display = 'block';

  document.getElementById('upload').value = '';
  document.getElementById('search').value = '';
});

// === Search ===
document.getElementById('search').addEventListener('input', function () {
  const query = this.value.trim().toLowerCase();
  if (query === '') {
    drawChart(originalData);
    lastData = originalData;
    return;
  }

  const matched = originalData.find(row => row.First_Name.toLowerCase().includes(query));
  if (!matched) {
    drawChart([]);
    lastData = [];
    return;
  }

  const subtree = [];
  function addSubtree(currentId) {
    originalData.forEach(row => {
      if (row["Parent ID"] === currentId) {
        subtree.push(row);
        addSubtree(row.ID);
      }
    });
  }

  subtree.push(matched);
  addSubtree(matched.ID);

  drawChart(subtree);
  lastData = subtree;
});

// === Draw Org Chart ===
function drawChart(data) {
  const nodes = data.map(row => ({
    id: row.ID,
    pid: row["Parent ID"] || null,
    name: row.First_Name,
    title: row.Designation,
    img: row.Image_URL || "https://cdn.balkan.app/shared/empty-img-white.svg"
  }));

  // Olivia template with slightly smaller profile image and bigger text
  OrgChart.templates.olivia = Object.assign({}, OrgChart.templates.ana);
  OrgChart.templates.olivia.size = [300, 220];
  OrgChart.templates.olivia.node =
    '<rect x="0" y="0" height="{h}" width="{w}" rx="10" ry="10" fill="#fff" stroke="#000" stroke-width="2"></rect>';
  // Profile image smaller and moved slightly up
  OrgChart.templates.olivia.img_0 =
    '<clipPath id="circleImg"><circle cx="150" cy="40" r="25"/></clipPath>' +
    '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#circleImg)" x="125" y="15" width="50" height="50" xlink:href="{val}"/>';

  // Name: increased font size, full width, wrapped and centered
  OrgChart.templates.olivia.field_0 =
    '<foreignObject x="10" y="75" width="280" height="70">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" ' +
        'style="font-size:34px;font-weight:700;color:#000;text-align:center;' +
        'line-height:1.2;word-wrap:break-word;height:100%;display:flex;' +
        'align-items:center;justify-content:center;overflow-wrap:anywhere;">{val}</div>' +
    '</foreignObject>';

  // Designation: slightly bigger font, full width, wrapped and centered
  OrgChart.templates.olivia.field_1 =
    '<foreignObject x="10" y="145" width="280" height="50">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" ' +
        'style="font-size:22px;font-weight:600;color:#555;text-align:center;' +
        'line-height:1.2;word-wrap:break-word;height:100%;display:flex;' +
        'align-items:center;justify-content:center;overflow-wrap:anywhere;">{val}</div>' +
    '</foreignObject>';

 OrgChart.templates.olivia.plus =
  '<g style="cursor:pointer;">' +
  '<circle cx="15" cy="15" r="14" fill="#fff" stroke="#000" stroke-width="5"></circle>' +
  '<line x1="8" y1="15" x2="22" y2="15" stroke="#000" stroke-width="5" />' +
  '<line x1="15" y1="8" x2="15" y2="22" stroke="#000" stroke-width="5" />' +
  '</g>';

OrgChart.templates.olivia.minus =
  '<g style="cursor:pointer;">' +
  '<circle cx="15" cy="15" r="14" fill="#fff" stroke="#000" stroke-width="4"></circle>' +
  '<line x1="8" y1="15" x2="22" y2="15" stroke="#000" stroke-width="5" />' +
  '</g>';

  OrgChart.templates.olivia.link = '<path stroke-linejoin="round" stroke="#000" stroke-width="2px" fill="none" d="{rounded}" />';

  const chart = new OrgChart(document.getElementById("orgChart"), {
    nodes: nodes,
    nodeBinding: {
      img_0: "img",
      field_0: "name",
      field_1: "title"
    },
    scaleInitial: OrgChart.match.boundary,
    layout: OrgChart.mixed,
    enableSearch: false,
    template: "olivia",
    spacing: 10,
    levelSeparation: 40,
    nodeMouseClick: OrgChart.action.none,
  });

  // Popup binding
  chart.on("click", function(sender, args){
    const empId = args.node.id;
    const emp = data.find(r => r.ID.toString() === empId.toString());
    const manager = data.find(r => r.ID === emp["Parent ID"]);

    document.getElementById('emp-id').textContent = emp.ID;
    document.getElementById('emp-name').textContent = emp.First_Name;
    document.getElementById('emp-designation').textContent = emp.Designation;
    document.getElementById('emp-under').textContent = manager ? manager.First_Name : 'None';

    document.getElementById('popup').classList.remove('hidden');
  });
}

document.getElementById('close-popup').addEventListener('click', () => {
  document.getElementById('popup').classList.add('hidden');
});

document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

window.onafterprint = function () {
  document.getElementById('search').value = '';
  drawChart(originalData);
  lastData = originalData;
};

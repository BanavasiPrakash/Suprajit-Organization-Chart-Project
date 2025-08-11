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

    // Show chart UI
    document.getElementById('chart_div').style.display = 'block';
    document.getElementById('search').style.display = 'inline-block';
    document.getElementById('refreshBtn').style.display = 'inline-block';
    document.getElementById('backBtn').style.display = 'inline-block';
    document.getElementById('printBtn').style.display = 'inline-block';

    // Hide upload UI
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

  drawChart(subtree, matched.ID);  // Pass matched ID for highlight
  lastData = subtree;
});

// === Draw Org Chart (Olivia template with custom styles) ===
function drawChart(data, highlightId = null) {
  const nodes = data.map(row => ({
    id: row.ID,
    pid: row["Parent ID"] || null,
    name: row.First_Name,
    title: row.Designation,
    img: row.Photo || "https://cdn.balkan.app/shared/empty-img-white.svg"
  }));

  // === Increased card size (width x height)
  OrgChart.templates.olivia.size = [970, 700];

  // === Default card border (black)
  OrgChart.templates.olivia.node =
    '<rect x="0" y="0" height="{h}" width="{w}" rx="14" ry="14" fill="#fff" stroke="#000" stroke-width="6"></rect>';

  // === Highlight template (red border)
  OrgChart.templates.highlight = Object.assign({}, OrgChart.templates.olivia);
  OrgChart.templates.highlight.node =
    '<rect x="0" y="0" height="{h}" width="{w}" rx="16" ry="14" fill="#fff" stroke="red" stroke-width="8"></rect>';

  // === Connection lines
  OrgChart.templates.olivia.link =
    '<path stroke-linejoin="round" stroke="#000" stroke-width="4px" fill="none" d="{rounded}" />';

  // === Photo at top center (reduced size)
  OrgChart.templates.olivia.img_0 =
    '<clipPath id="ulaImg">' +
    '<circle cx="365" cy="100" r="50"></circle>' +
    '</clipPath>' +
    '<image preserveAspectRatio="xMidYMid slice" clip-path="url(#ulaImg)" xlink:href="{val}" x="320" y="50" width="100" height="100"></image>';

  // === Name (big font + increased height) - full width 880
  OrgChart.templates.olivia.field_0 =
    '<foreignObject x="0" y="200" width="880" height="180">' +
    '<div xmlns="http://www.w3.org/1999/xhtml" ' +
    'style="margin:0; padding:7px; font-size:85px; font-weight:bold; font-family:Arial, sans-serif; color:black; text-align:center; overflow:hidden; white-space:normal; word-wrap:break-word; line-height:1.1;">{val}</div>' +
    '</foreignObject>';

  // === Designation (bigger font, moved down, adjusted size and improved wrapping)
  OrgChart.templates.olivia.field_1 =
    '<foreignObject x="0" y="380" width="880" height="190">' +
    '<div xmlns="http://www.w3.org/1999/xhtml" ' +
    'style="margin:0; padding:17px; font-size:80px; font-family:Arial, sans-serif; color:black; text-align:center; overflow-wrap: break-word; word-break: break-word; white-space: normal; line-height:1.1;">{val}</div>' +
    '</foreignObject>';

  // === Customize the +/- expand collapse buttons ===
  OrgChart.templates.olivia.plus =
    '<circle cx="0" cy="0" r="30" fill="Black"></circle>' +
    '<text text-anchor="middle" alignment-baseline="middle" font-size="50" font-weight="bold" fill="#fff" x="0" y="7">+</text>';
  OrgChart.templates.olivia.minus =
    '<circle cx="0" cy="0" r="30" fill="Black"></circle>' +
    '<text text-anchor="middle" alignment-baseline="middle" font-size="50" font-weight="bold" fill="#fff" x="0" y="7">–</text>';

  const chart = new OrgChart(document.getElementById("orgChart"), {
    nodes: nodes,
    nodeBinding: {
      field_0: "name",
      field_1: "title",
      img_0: "img"
    },
    scaleInitial: OrgChart.match.boundary,
    layout: OrgChart.mixed,
    template: "olivia",

    enableSearch: false,

    siblingSeparation: 100,
    subtreeSeparation: 80,
    spacing: 200,
    levelSeparation: 180, // reduced vertical spacing for less gap

    nodeMouseClick: OrgChart.action.none
  });

  chart.on("click", function (sender, args) {
    const empId = args.node.id;
    const emp = data.find(r => r.ID.toString() === empId.toString());
    const manager = data.find(r => r.ID === emp["Parent ID"]);

    document.getElementById('emp-id').textContent = emp.ID;
    document.getElementById('emp-name').textContent = emp.First_Name;
    document.getElementById('emp-designation').textContent = emp.Designation;
    document.getElementById('emp-under').textContent = manager ? manager.First_Name : 'None';

    document.getElementById('popup').classList.remove('hidden');
  });

  if (highlightId) {
    let selectedNode = chart.get(highlightId);
    if (selectedNode) {
      selectedNode.template = "highlight";
      chart.draw();
    }
  }
}

document.getElementById('close-popup').addEventListener('click', () => {
  document.getElementById('popup').classList.add('hidden');
});

// === Print ===
document.getElementById('printBtn').addEventListener('click', () => {
  window.print();
});

window.onafterprint = function () {
  document.getElementById('search').value = '';
  drawChart(originalData);
  lastData = originalData;
};

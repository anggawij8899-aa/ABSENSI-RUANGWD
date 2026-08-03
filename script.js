// Dark Mode
function toggleDarkMode(){
  document.getElementById("body").classList.toggle("bg-dark");
  document.getElementById("body").classList.toggle("text-white");
}

// Statistik Chart
const ctx = document.getElementById('statistikChart');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Izin', 'Absensi', 'Aktif'],
    datasets: [{
      label: 'Statistik',
      data: [12, 19, 7],
      backgroundColor: ['#0d6efd','#198754','#dc3545']
    }]
  }
});

// Drag & Drop kategori
Sortable.create(document.getElementById('kategoriList'), {
  animation: 150
});

// Search filter
document.getElementById("searchBox").addEventListener("keyup", function(){
  let filter = this.value.toLowerCase();
  let rows = document.querySelectorAll("#dataTable tr");
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
  });
});

// Backup JSON
function backupData(){
  let data = {users:[{nama:"Angga",status:"Aktif"}]};
  let blob = new Blob([JSON.stringify(data)], {type:"application/json"});
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup.json";
  link.click();
}

// Export Excel (pakai SheetJS)
function exportExcel(){
  alert("Export Excel bosku! (Integrasi SheetJS)");
}

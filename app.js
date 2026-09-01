// ===================================================================
// MR. PARRILLA -XPRESS- | LÓGICA Y CONEXIÓN DEL DASHBOARD GERENCIAL
// ===================================================================

// URL del Endpoint JSON de Google Apps Script (Web App desplegada)
const API_URL = "https://script.google.com/macros/s/AKfycbzvjDuxGt4M53Cxa0SjgHinxkyvEmZiMNuIkHmeUQhYg43jB0lU9s633Jn0_dtA728-/exec";

let chartMetodosInstance = null;
let chartPlatosInstance = null;

// PIN de Seguridad por defecto (Cámbialo si deseas por el que tú y la dueña quieran)
const PIN_GERENCIAL = "2026";

document.addEventListener("DOMContentLoaded", () => {
  // Verificar si ya inició sesión previamente en este dispositivo
  const sesionActiva = sessionStorage.getItem("sicr_autenticado");
  const modal = document.getElementById("loginModal");

  if (sesionActiva === "true") {
    if (modal) modal.style.display = "none";
    iniciarDashboard();
  } else {
    if (modal) modal.style.display = "flex";
    const pinInput = document.getElementById("pinInput");
    if (pinInput) {
      pinInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") verificarPIN();
      });
    }
  }
});

function verificarPIN() {
  const pinIngresado = document.getElementById("pinInput").value.trim();
  const errorSpan = document.getElementById("errorPin");

  if (pinIngresado === PIN_GERENCIAL) {
    sessionStorage.setItem("sicr_autenticado", "true");
    document.getElementById("loginModal").style.display = "none";
    iniciarDashboard();
  } else {
    errorSpan.textContent = "❌ PIN incorrecto. Intenta de nuevo.";
    document.getElementById("pinInput").value = "";
    document.getElementById("pinInput").focus();
  }
}

// Navegación Modular entre Pantallas (SPA)
function navegarModulo(idModulo) {
  // 1. Ocultar todas las vistas y mostrar la seleccionada
  document.querySelectorAll('.modulo-vista').forEach(v => v.classList.remove('active'));
  const vistaActiva = document.getElementById('modulo-' + idModulo);
  if (vistaActiva) vistaActiva.classList.add('active');

  // 2. Actualizar botón activo en la barra lateral
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) event.currentTarget.classList.add('active');

  // 3. Cambiar título y descripción superior
  const titulos = {
    resumen: { t: "Resumen General del Negocio", d: "Monitoreo en vivo de ventas, qué falta comprar y cómo va la plata en caja" },
    inventario: { t: "¿Qué hay que comprar para la parrilla?", d: "Semáforo en vivo de insumos y presupuesto estimado para el mandado" },
    ventas: { t: "Historial Completo de Ventas y Cuentas", d: "Detalle de cada comanda cobrada, mesero y medio de pago" },
    caja: { t: "Cuadre de Caja (Para ver si falta plata)", d: "Revisión estricta de dinero físico en gaveta vs. ventas del sistema" },
    mermas: { t: "Comida que se Dañó, Quemó o Cayó", d: "Registro de comida perdida en la parrilla o salón para saber por qué falta inventario" }
  };

  if (titulos[idModulo]) {
    document.getElementById("viewTitle").textContent = titulos[idModulo].t;
    document.getElementById("viewDesc").textContent = titulos[idModulo].d;
  }
}

function iniciarDashboard() {
  const temaGuardado = localStorage.getItem("tema_mrparrilla") || "dark";
  if (temaGuardado === "light") {
    document.body.classList.add("light-theme");
    const btnIcon = document.querySelector("#btnThemeToggle i");
    if (btnIcon) {
      btnIcon.classList.remove("fa-sun");
      btnIcon.classList.add("fa-moon");
    }
  }
  cargarDatosDashboard();
}

// Función para alternar entre Modo Claro y Oscuro
function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  const btnIcon = document.querySelector("#btnThemeToggle i");

  if (isLight) {
    btnIcon.classList.remove("fa-sun");
    btnIcon.classList.add("fa-moon");
    localStorage.setItem("tema_mrparrilla", "light");
  } else {
    btnIcon.classList.remove("fa-moon");
    btnIcon.classList.add("fa-sun");
    localStorage.setItem("tema_mrparrilla", "dark");
  }

  // Re-renderizar gráficos para que coincidan los colores de texto
  if (chartMetodosInstance || chartPlatosInstance) {
    cargarDatosDashboard();
  }
}

async function cargarDatosDashboard() {
  const lastUpdateSpan = document.getElementById("lastUpdate");
  lastUpdateSpan.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Sincronizando con Google Sheets...";

  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    if (data.ok) {
      procesarKPIs(data);
      renderizarGraficos(data);
      renderizarTablaInsumos(data.insumos);
      renderizarTablaCortes(data.cortes);
      renderizarTablaVentasDetalle(data.ventas);
      renderizarTablaMermas(data.mermas);

      const ahora = new Date();
      lastUpdateSpan.textContent = "Última sincronización: " + ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else {
      lastUpdateSpan.textContent = "Error al obtener datos: " + data.error;
    }
  } catch (err) {
    console.error("Error al cargar datos:", err);
    lastUpdateSpan.textContent = "⚠️ Error de conexión con Google Apps Script.";
  }
}

// 1. Procesamiento de Tarjetas KPI
function procesarKPIs(data) {
  const hoyStr = new Date().toISOString().split('T')[0];
  let ventasHoy = 0;
  let efectivoHoy = 0;
  let digitalHoy = 0;
  let cuentasHoy = 0;

  data.ventas.forEach(v => {
    // Si coincide con la fecha de hoy y está cobrado
    if (v.estado === "Cobrado") {
      const total = parseFloat(v.total) || 0;
      ventasHoy += total;
      cuentasHoy++;

      const metodo = (v.metodoPago || "").toUpperCase();
      if (metodo.includes("EFECTIVO")) {
        efectivoHoy += total;
      } else {
        digitalHoy += total;
      }
    }
  });

  // Insumos críticos
  const criticosCount = (data.insumos || []).filter(i => (parseFloat(i.stockActual) || 0) <= (parseFloat(i.stockMinimo) || 0)).length;

  document.getElementById("kpiVentasHoy").textContent = "$" + ventasHoy.toLocaleString('es-CO');
  document.getElementById("kpiCuentasHoy").textContent = cuentasHoy + " cuentas cobradas";
  document.getElementById("kpiEfectivo").textContent = "$" + efectivoHoy.toLocaleString('es-CO');
  document.getElementById("kpiDigital").textContent = "$" + digitalHoy.toLocaleString('es-CO');
  document.getElementById("kpiInsumosCriticos").textContent = criticosCount;
}

// 2. Renderizado de Gráficos (Chart.js)
function renderizarGraficos(data) {
  // Gráfico 1: Métodos de Pago
  let ef = 0, dig = 0;
  data.ventas.forEach(v => {
    if (v.estado === "Cobrado") {
      const tot = parseFloat(v.total) || 0;
      if ((v.metodoPago || "").toUpperCase().includes("EFECTIVO")) ef += tot;
      else dig += tot;
    }
  });

  const ctxMetodos = document.getElementById("chartMetodosPago").getContext("2d");
  if (chartMetodosInstance) chartMetodosInstance.destroy();

  chartMetodosInstance = new Chart(ctxMetodos, {
    type: 'doughnut',
    data: {
      labels: ['Efectivo en Caja', 'Nequi / Datáfono'],
      datasets: [{
        data: [ef, dig],
        backgroundColor: ['#10B981', '#3B82F6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { family: 'Outfit' } } }
      }
    }
  });

  // Gráfico 2: Platos Más Vendidos
  const platoConteo = {};
  data.ventas.forEach(v => {
    if (v.detalle) {
      const items = v.detalle.split(", ");
      items.forEach(it => {
        const parts = it.split("x ");
        const cant = parseInt(parts[0]) || 1;
        const nombre = parts[1] || it;
        platoConteo[nombre] = (platoConteo[nombre] || 0) + cant;
      });
    }
  });

  const sortedPlatos = Object.entries(platoConteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const labelsPlatos = sortedPlatos.map(p => p[0]);
  const dataPlatos = sortedPlatos.map(p => p[1]);

  const ctxPlatos = document.getElementById("chartTopPlatos").getContext("2d");
  if (chartPlatosInstance) chartPlatosInstance.destroy();

  chartPlatosInstance = new Chart(ctxPlatos, {
    type: 'bar',
    data: {
      labels: labelsPlatos,
      datasets: [{
        label: 'Unidades Vendidas',
        data: dataPlatos,
        backgroundColor: '#F97316',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#9CA3AF', maxRotation: 20 }, grid: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// 3. Renderizado de Tabla de Insumos / Compras
function renderizarTablaInsumos(insumos) {
  const tbody = document.getElementById("tablaInsumosBody");
  tbody.innerHTML = "";

  if (!insumos || insumos.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8' class='text-center'>No hay insumos registrados en la hoja aún.</td></tr>";
    return;
  }

  insumos.forEach(i => {
    const act = parseFloat(i.stockActual) || 0;
    const min = parseFloat(i.stockMinimo) || 0;
    const costoUnit = parseFloat(i.costoUnitario) || 0;
    const esCritico = act <= min;

    let sugerenciaCompra = 0;
    let costoTotalSugerido = 0;

    if (esCritico) {
      sugerenciaCompra = (min * 2) - act;
      if (sugerenciaCompra <= 0) sugerenciaCompra = min;
      costoTotalSugerido = sugerenciaCompra * costoUnit;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${i.nombre}</strong></td>
      <td>${i.categoria || 'General'}</td>
      <td><strong>${act}</strong> ${i.unidad}</td>
      <td>${min} ${i.unidad}</td>
      <td>
        <span class="badge ${esCritico ? 'badge-critico' : 'badge-ok'}">
          <i class="fa-solid ${esCritico ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
          ${esCritico ? '¡Comprar Hoy Mismo!' : 'Stock Completo'}
        </span>
      </td>
      <td>${esCritico ? `<strong>+${sugerenciaCompra} ${i.unidad}</strong>` : '-'}</td>
      <td>${esCritico ? '$' + costoTotalSugerido.toLocaleString('es-CO') : '-'}</td>
      <td><small style="color:var(--text-muted);">${i.proveedor || 'Mercado / Proveedor'}</small></td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Renderizado de Tabla de Cortes de Caja Ciega
function renderizarTablaCortes(cortes) {
  const tbody = document.getElementById("tablaCortesBody");
  tbody.innerHTML = "";

  if (!cortes || cortes.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7' class='text-center'>No hay registros de cuadres de caja todavía.</td></tr>";
    return;
  }

  cortes.slice(-8).reverse().forEach(c => {
    const dif = parseFloat(c.diferencia) || 0;
    let badgeClass = "badge-ok";
    let estadoTexto = c.estado;
    if (dif < -1000) {
      badgeClass = "badge-critico";
      estadoTexto = "⚠️ Faltó Plata";
    } else if (dif > 1000) {
      badgeClass = "badge-sobrante";
      estadoTexto = "ℹ️ Sobró Plata";
    } else {
      estadoTexto = "✅ Caja Cuadrada";
    }

    const fechaStr = new Date(c.fecha).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fechaStr}</td>
      <td><strong>${c.cajero}</strong></td>
      <td>$${(parseFloat(c.montoFisico)||0).toLocaleString('es-CO')}</td>
      <td>$${(parseFloat(c.totalEfectivo)||0).toLocaleString('es-CO')}</td>
      <td>$${(parseFloat(c.totalDigital)||0).toLocaleString('es-CO')}</td>
      <td><strong style="color:${dif < -1000 ? '#F87171' : '#34D399'};">$${dif.toLocaleString('es-CO')}</strong></td>
      <td><span class="badge ${badgeClass}">${estadoTexto}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 5. Renderizado de Tabla de Ventas y Comandas en Detalle
function renderizarTablaVentasDetalle(ventas) {
  const tbody = document.getElementById("tablaVentasDetalleBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!ventas || ventas.length === 0) {
    tbody.innerHTML = "<tr><td colspan='8' class='text-center'>No hay ventas registradas aún.</td></tr>";
    return;
  }

  ventas.slice().reverse().forEach(v => {
    const fStr = v.fecha ? new Date(v.fecha).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${v.id}</code></td>
      <td>${fStr}</td>
      <td><strong>${v.mesa}</strong></td>
      <td>${v.mesero || 'Mesero'}</td>
      <td>${v.detalle}</td>
      <td><strong>$${(parseFloat(v.total)||0).toLocaleString('es-CO')}</strong></td>
      <td>${v.metodoPago || '-'}</td>
      <td><span class="badge ${v.estado === 'Cobrado' ? 'badge-ok' : 'badge-critico'}">${v.estado}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 6. Renderizado de Tabla de Mermas
function renderizarTablaMermas(mermas) {
  const tbody = document.getElementById("tablaMermasBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!mermas || mermas.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5' class='text-center'>No hay comida dañada ni mermas reportadas. ¡Excelente trabajo en cocina!</td></tr>";
    return;
  }

  mermas.slice().reverse().forEach(m => {
    const fStr = m.fecha ? new Date(m.fecha).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${m.id}</code></td>
      <td>${fStr}</td>
      <td><strong>${m.plato}</strong></td>
      <td><span class="badge badge-critico">${m.motivo}</span></td>
      <td>${m.auditor || 'Personal'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 7. Imprimir Lista de Compras
function imprimirListaCompras() {
  window.print();
}

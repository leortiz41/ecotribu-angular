import { Chart, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);
Chart.defaults.font.family = "'Avenir Next', 'Segoe UI', 'Trebuchet MS', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.font.weight = 'bold';
Chart.defaults.color = '#0f172a';

export function crearGraficoTablero(
  canvas: HTMLCanvasElement,
  graficoActual: Chart | null | undefined,
  labels: string[],
  data: number[],
  datasetLabel: string,
  colorPrincipal: string,
  tipo: ChartType = 'bar'
): Chart {
  if (graficoActual) {
    graficoActual.destroy();
  }

  const contexto = canvas.getContext('2d');

  if (!contexto) {
    throw new Error('No se pudo inicializar el canvas del gráfico.');
  }

  const coloresDoughnut = ['#047857', '#0f766e', '#14b8a6', '#22c55e', '#86efac', '#a7f3d0'];
  const esCircular = tipo === 'doughnut' || tipo === 'pie';
  const configuracion: any = {
    type: tipo,
    data: {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data,
          backgroundColor: esCircular ? coloresDoughnut.slice(0, data.length) : labels.map(() => colorPrincipal),
          borderColor: colorPrincipal,
          borderWidth: tipo === 'line' ? 3 : 1,
          borderRadius: tipo === 'bar' ? 12 : 0,
          maxBarThickness: 44,
          fill: tipo === 'line' ? false : undefined,
          tension: tipo === 'line' ? 0.35 : undefined,
          pointRadius: tipo === 'line' ? 4 : undefined,
          pointHoverRadius: tipo === 'line' ? 6 : undefined,
          pointBackgroundColor: tipo === 'line' ? colorPrincipal : undefined,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: tipo === 'doughnut' ? '58%' : undefined,
      plugins: {
        legend: {
          display: true,
          position: esCircular ? 'bottom' : 'top',
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 16,
            font: {
              size: 12,
              weight: 'bold',
            },
            color: '#0f172a',
          },
        },
        tooltip: {
          enabled: true,
          bodyFont: {
            size: 12,
            weight: 'bold',
          },
          titleFont: {
            size: 13,
            weight: 'bold',
          },
        },
      },
    },
  };

  if (!esCircular) {
    configuracion.options.scales = {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#0f172a',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 100,
        ticks: {
          color: '#0f172a',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(15, 23, 42, 0.12)',
        },
      },
    };
  }

  if (tipo === 'line') {
    configuracion.options.elements = {
      line: {
        borderJoinStyle: 'round',
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    };
  }

  return new Chart(contexto, configuracion);
}

export function crearGraficoBarras(
  canvas: HTMLCanvasElement,
  graficoActual: Chart | null | undefined,
  labels: string[],
  data: number[],
  datasetLabel: string,
  colorPrincipal: string
): Chart {
  return crearGraficoTablero(canvas, graficoActual, labels, data, datasetLabel, colorPrincipal, 'bar');
}

export function crearGraficoLinea(
  canvas: HTMLCanvasElement,
  graficoActual: Chart | null | undefined,
  labels: string[],
  data: number[],
  datasetLabel: string,
  colorPrincipal: string
): Chart {
  return crearGraficoTablero(canvas, graficoActual, labels, data, datasetLabel, colorPrincipal, 'line');
}

export function crearGraficoDona(
  canvas: HTMLCanvasElement,
  graficoActual: Chart | null | undefined,
  labels: string[],
  data: number[],
  datasetLabel: string,
  colorPrincipal: string
): Chart {
  return crearGraficoTablero(canvas, graficoActual, labels, data, datasetLabel, colorPrincipal, 'doughnut');
}

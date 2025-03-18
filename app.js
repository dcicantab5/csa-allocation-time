// Main application script for ETD Circular Statistical Analysis
document.addEventListener('DOMContentLoaded', function() {
  // Load data
  fetch('csa_data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Initialize the dashboard with the data
      initializeDashboard(data);
      // Hide loading spinner
      document.getElementById('loadingSpinner').style.display = 'none';
    })
    .catch(error => {
      console.error('Error loading data:', error);
      alert('Error loading data. Please check console for details.');
      document.getElementById('loadingSpinner').style.display = 'none';
    });
});

function initializeDashboard(data) {
  // Set metadata and update footer
  displayMetadata(data.metadata);
  
  // Initialize Overview Tab
  initializeOverviewTab(data);
  
  // Initialize Hourly Analysis Tab
  initializeHourlyTab(data.hourlyDistribution, data.peakActivity);
  
  // Initialize Time Blocks Tab
  initializeTimeBlocksTab(data.timeBlocks);
  
  // Initialize Daily Patterns Tab
  initializeDailyPatternsTab(data.dayStats);
  
  // Initialize Circular Statistics Tab
  initializeCircularStatsTab(data);
}

function displayMetadata(metadata) {
  // Format and display the generation date
  const date = new Date(metadata.analysisDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('footerDate').textContent = formattedDate;
}

function initializeOverviewTab(data) {
  // Display overview highlights
  const overviewHighlights = document.getElementById('overviewHighlights');
  overviewHighlights.innerHTML = `
    <li>Mean arrival time is <strong>${data.summary.meanDirection.time}</strong>, with 95% confidence interval from 
        ${data.summary.confidenceInterval.lowerBound} to ${data.summary.confidenceInterval.upperBound}</li>
    <li>Patient arrivals are <strong>not uniformly distributed</strong> throughout the day (Rayleigh test p-value: ${data.uniformityTests.rayleigh.pValue.toExponential(3)})</li>
    <li>Peak arrival hour is <strong>${data.peakActivity.hourlyPeaks[0].timeSlot}</strong> with ${data.peakActivity.hourlyPeaks[0].count} patients (${((data.peakActivity.hourlyPeaks[0].count/data.metadata.totalObservations)*100).toFixed(1)}%)</li>
    <li>Peak 4-hour block is <strong>${data.peakActivity.blockPeak}</strong> with ${data.timeBlocks.find(block => block.timeBlock === data.peakActivity.blockPeak).percentage}% of arrivals</li>
    <li>Total of <strong>${data.metadata.totalObservations}</strong> patient arrivals analyzed over ${data.metadata.numberOfDays} days</li>
  `;
  
  // Create peak activity chart
  createPeakActivityChart(data.peakActivity.hourlyPeaks);
  
  // Create mean direction table
  const meanDirectionTable = document.getElementById('meanDirectionTable');
  meanDirectionTable.innerHTML = `
    <tr>
      <td>Mean Arrival Time</td>
      <td>${data.summary.meanDirection.time}</td>
    </tr>
    <tr>
      <td>95% Confidence Interval</td>
      <td>${data.summary.confidenceInterval.lowerBound} - ${data.summary.confidenceInterval.upperBound}</td>
    </tr>
    <tr>
      <td>Mean Resultant Length</td>
      <td>${data.summary.concentration.meanResultantLength.toFixed(4)}</td>
    </tr>
    <tr>
      <td>Concentration (κ)</td>
      <td>${data.summary.concentration.kappa.toFixed(4)}</td>
    </tr>
    <tr>
      <td>Circular Variance</td>
      <td>${data.summary.variance.circularVariance.toFixed(4)}</td>
    </tr>
    <tr>
      <td>Circular Standard Deviation</td>
      <td>${data.summary.variance.circularStandardDeviation.hours.toFixed(2)} hours</td>
    </tr>
  `;
  
  // Create confidence interval chart
  createConfidenceIntervalChart(data.summary);
  
  // Create uniformity tests table
  const uniformityTestsTable = document.getElementById('uniformityTestsTable');
  uniformityTestsTable.innerHTML = `
    <tr>
      <td>Rayleigh Test</td>
      <td>Z = ${data.uniformityTests.rayleigh.zStatistic.toFixed(4)}</td>
      <td>${data.uniformityTests.rayleigh.pValue.toExponential(4)}</td>
      <td>Highly significant clustering of arrival times (p < 0.001)</td>
    </tr>
    <tr>
      <td>Hodges-Ajne Test</td>
      <td>M = ${data.uniformityTests.hodgesAjne.mStatistic} (ratio: ${data.uniformityTests.hodgesAjne.ratio.toFixed(4)})</td>
      <td>Not provided</td>
      <td>Confirms non-uniform distribution of arrival times</td>
    </tr>
  `;
  
  // Create recommendations list
  const recommendationsList = document.getElementById('recommendationsList');
  recommendationsList.innerHTML = `
    <li>Optimize staffing during peak hours (${data.peakActivity.hourlyPeaks[0].timeSlot}) to accommodate higher patient volume</li>
    <li>Consider extended evening coverage based on the mean arrival time (${data.summary.meanDirection.time})</li>
    <li>Implement staggered staff shifts to better match the ${data.peakActivity.blockPeak} peak time block</li>
    <li>Review discharge planning to create bed capacity before peak arrival times</li>
    <li>Consider process improvements to reduce wait times during high-volume periods</li>
    <li>Analyze reasons for high evening/night admissions and collaborate with referring facilities</li>
  `;
}

function createPeakActivityChart(peakHours) {
  const ctx = document.getElementById('peakActivityChart').getContext('2d');
  
  // Extract data
  const labels = peakHours.map(peak => peak.timeSlot);
  const counts = peakHours.map(peak => peak.count);
  
  // Create chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Arrivals',
        data: counts,
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Top Peak Hours'
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Arrivals'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time Slot'
          }
        }
      }
    }
  });
}

function createConfidenceIntervalChart(summary) {
  const ctx = document.getElementById('confidenceIntervalChart').getContext('2d');
  
  // Convert time strings to hour values for visualization
  const meanTime = timeStringToDecimal(summary.meanDirection.time);
  const lowerBound = timeStringToDecimal(summary.confidenceInterval.lowerBound);
  const upperBound = timeStringToDecimal(summary.confidenceInterval.upperBound);
  
  // Create chart
  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Mean Time',
          data: [{ x: meanTime, y: 1 }],
          backgroundColor: 'rgba(255, 99, 132, 1)',
          pointRadius: 8,
          pointHoverRadius: 10
        },
        {
          label: '95% Confidence Interval',
          data: [
            { x: lowerBound, y: 1 },
            { x: upperBound, y: 1 }
          ],
          backgroundColor: 'rgba(67, 97, 238, 0.7)',
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: true,
          borderColor: 'rgba(67, 97, 238, 0.7)',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Mean Arrival Time with 95% Confidence Interval'
        }
      },
      scales: {
        y: {
          display: false,
          min: 0,
          max: 2
        },
        x: {
          type: 'linear',
          min: 0,
          max: 24,
          title: {
            display: true,
            text: 'Hour of Day'
          },
          ticks: {
            callback: function(value) {
              return value + ':00';
            },
            stepSize: 2
          }
        }
      }
    }
  });
}

function initializeHourlyTab(hourlyData, peakData) {
  // Create hourly distribution chart
  createHourlyDistributionChart(hourlyData);
  
  // Create peak hours table
  const peakHoursTable = document.getElementById('peakHoursTable');
  peakData.hourlyPeaks.forEach(peak => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${peak.timeSlot}</td>
      <td>${peak.count}</td>
      <td>${((peak.count / 558) * 100).toFixed(1)}%</td>
    `;
    peakHoursTable.appendChild(row);
  });
  
  // Create peak hours pie chart
  createPeakHoursPieChart(peakData.hourlyPeaks);
  
  // Display hourly observations
  const hourlyObservations = document.getElementById('hourlyObservations');
  hourlyObservations.innerHTML = `
    <li>Evening hours (8:00-9:00 PM) show the highest patient arrival volume</li>
    <li>Secondary peak occurs in early morning hours (12:00-1:00 AM)</li>
    <li>Third peak occurs in early evening (5:00-6:00 PM)</li>
    <li>Morning hours (8:00-9:00 AM) show relatively low arrival volumes</li>
  `;
  
  // Display hourly implications
  const hourlyImplications = document.getElementById('hourlyImplications');
  hourlyImplications.innerHTML = `
    <li>Schedule maximum staffing during 8:00-9:00 PM peak hours</li>
    <li>Ensure adequate staffing for overnight peaks (12:00-2:00 AM)</li>
    <li>Consider shift handovers that don't coincide with peak arrival times</li>
    <li>Plan administrative tasks during lower-volume morning hours</li>
    <li>Coordinate with referring facilities about admission timing patterns</li>
  `;
}

function createHourlyDistributionChart(hourlyData) {
  const ctx = document.getElementById('hourlyDistributionChart').getContext('2d');
  
  // Extract data
  const labels = hourlyData.map(item => item.timeSlot);
  const counts = hourlyData.map(item => item.count);
  
  // Create chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Arrivals',
        data: counts,
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Arrivals'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Hour of Day'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Hourly Distribution of Patient Arrivals'
        },
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  });
}

function createPeakHoursPieChart(peakHours) {
  const ctx = document.getElementById('peakHoursChart').getContext('2d');
  
  // Extract data
  const labels = peakHours.map(peak => peak.timeSlot);
  const counts = peakHours.map(peak => peak.count);
  
  // Calculate total for percentages
  const total = counts.reduce((sum, count) => sum + count, 0);
  
  // Create chart
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: 'white',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Top Peak Hours Distribution'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} arrivals (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function initializeTimeBlocksTab(timeBlocksData) {
  // Create time blocks chart
  createTimeBlocksChart(timeBlocksData);
  
  // Create time blocks table
  const timeBlocksTable = document.getElementById('timeBlocksTable');
  timeBlocksData.forEach(block => {
    const row = document.createElement('tr');
    
    // Create progress bar visual
    const progressBar = `
      <div class="progress" style="height: 20px;">
        <div class="progress-bar" role="progressbar" style="width: ${block.percentage}%; background-color: rgba(67, 97, 238, 0.7);" 
          aria-valuenow="${block.percentage}" aria-valuemin="0" aria-valuemax="100">${block.percentage}%</div>
      </div>
    `;
    
    row.innerHTML = `
      <td>${block.timeBlock}</td>
      <td>${block.count}</td>
      <td>${block.percentage}%</td>
      <td>${progressBar}</td>
    `;
    timeBlocksTable.appendChild(row);
  });
  
  // Create time block comparison chart
  createTimeBlockComparisonChart(timeBlocksData);
  
  // Display time block insights
  const timeBlockInsights = document.getElementById('timeBlockInsights');
  timeBlockInsights.innerHTML = `
    <li>The 4pm-8pm block contains the highest percentage of arrivals (${timeBlocksData.find(block => block.timeBlock === '4pm-8pm').percentage}%)</li>
    <li>The 12am-4am block has the second highest patient volume (${timeBlocksData.find(block => block.timeBlock === '12am-4am').percentage}%)</li>
    <li>Patient arrivals are lowest during 4am-8am (${timeBlocksData.find(block => block.timeBlock === '4am-8am').percentage}%)</li>
    <li>Evening and night hours (4pm-4am) account for over ${timeBlocksData.filter(block => ['4pm-8pm', '8pm-12am', '12am-4am'].includes(block.timeBlock)).reduce((sum, block) => sum + block.percentage, 0).toFixed(1)}% of all arrivals</li>
    <li>Daytime hours (8am-4pm) have more consistent, moderate arrival volumes</li>
  `;
}

function createTimeBlocksChart(timeBlocksData) {
  const ctx = document.getElementById('timeBlocksChart').getContext('2d');
  
  // Extract data
  const labels = timeBlocksData.map(block => block.timeBlock);
  const counts = timeBlocksData.map(block => block.count);
  
  // Create chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Arrivals',
        data: counts,
        backgroundColor: 'rgba(67, 97, 238, 0.7)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Arrivals'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time Block'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: '4-Hour Time Block Distribution'
        },
        legend: {
          display: false
        }
      }
    }
  });
}

function createTimeBlockComparisonChart(timeBlocksData) {
  const ctx = document.getElementById('timeBlockComparisonChart').getContext('2d');
  
  // Extract data
  const labels = timeBlocksData.map(block => block.timeBlock);
  const percentages = timeBlocksData.map(block => block.percentage);
  
  // Create chart
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: percentages,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: 'white',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Time Block Percentage Distribution'
        }
      }
    }
  });
}

function initializeDailyPatternsTab(dayStatsData) {
  // Create daily mean time chart
  createDailyMeanTimeChart(dayStatsData);
  
  // Create daily stats cards
  const dailyStatsCards = document.getElementById('dailyStatsCards');
  dayStatsData.forEach(day => {
    const card = document.createElement('div');
    card.className = 'day-stats-card';
    
    card.innerHTML = `
      <div class="day-stats-header">
        <h4>${day.day}</h4>
      </div>
      <div class="day-stats-body">
        <div class="key-metric">
          <div class="key-metric-value">${day.meanTime}</div>
          <div class="key-metric-label">Mean Time</div>
        </div>
        <div class="key-metric">
          <div class="key-metric-value">${day.concentration.toFixed(3)}</div>
          <div class="key-metric-label">Concentration</div>
        </div>
        <div class="key-metric">
          <div class="key-metric-value">${day.variance.toFixed(3)}</div>
          <div class="key-metric-label">Variance</div>
        </div>
        <div class="key-metric">
          <div class="key-metric-value">${day.total}</div>
          <div class="key-metric-label">Total Arrivals</div>
        </div>
      </div>
    `;
    
    dailyStatsCards.appendChild(card);
  });
  
  // Create daily concentration chart
  createDailyConcentrationChart(dayStatsData);
  
  // Create daily total chart
  createDailyTotalChart(dayStatsData);
  
  // Display daily observations
  const dailyObservations = document.getElementById('dailyObservations');
  dailyObservations.innerHTML = `
    <li>Mean arrival times are consistently in the evening hours for most days (6 out of 9 days)</li>
    <li>Days 4hb and 6hb show different patterns with midday mean arrival times</li>
    <li>Day 5hb has the lowest concentration (0.061), indicating widely dispersed arrivals throughout the day</li>
    <li>Day 9hb has the highest concentration (0.409), showing more clustered arrival times</li>
    <li>Patient volume varies by day of the month, with 4hb and 5hb showing highest volumes (83 and 85 patients)</li>
    <li>Weekend days may have different patterns than weekdays (would require additional data)</li>
  `;
}

function createDailyMeanTimeChart(dayStatsData) {
  const ctx = document.getElementById('dailyMeanTimeChart').getContext('2d');
  
  // Convert mean time strings to decimal hours for visualization
  const labels = dayStatsData.map(day => day.day);
  const meanTimes = dayStatsData.map(day => timeStringToDecimal(day.meanTime));
  
  // Create chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Mean Arrival Time',
        data: meanTimes,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.2,
        pointStyle: 'circle',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Hour of Day'
          },
          min: 0,
          max: 24,
          ticks: {
            callback: function(value) {
              // Convert decimal hours to time format
              const hours = Math.floor(value);
              const minutes = Math.round((value - hours) * 60);
              return `${hours}:${minutes.toString().padStart(2, '0')}`;
            },
            stepSize: 3
          }
        },
        x: {
          title: {
            display: true,
            text: 'Day'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Mean Arrival Time by Day'
        }
      }
    }
  });
}

function createDailyConcentrationChart(dayStatsData) {
  const ctx = document.getElementById('dailyConcentrationChart').getContext('2d');
  
  // Extract data
  const labels = dayStatsData.map(day => day.day);
  const concentrations = dayStatsData.map(day => day.concentration);
  
  // Create chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Concentration',
        data: concentrations,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 0.5,
          title: {
            display: true,
            text: 'Concentration Value'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Day'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Arrival Time Concentration by Day'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `Concentration: ${value.toFixed(3)} (higher = more clustered)`;
            }
          }
        }
      }
    }
  });
}

function createDailyTotalChart(dayStatsData) {
  const ctx = document.getElementById('dailyTotalChart').getContext('2d');
  
  // Extract data
  const labels = dayStatsData.map(day => day.day);
  const totals = dayStatsData.map(day => day.total);
  
  // Create chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Arrivals',
        data: totals,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Arrivals'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Day'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Total Patient Arrivals by Day'
        }
      }
    }
  });
}

function initializeCircularStatsTab(data) {
  // Create circular histogram chart
  createCircularHistogramChart(data.hourlyDistribution);
  
  // Create concentration table
  const concentrationTable = document.getElementById('concentrationTable');
  concentrationTable.innerHTML = `
    <tr>
      <td>Mean Resultant Length</td>
      <td>${data.summary.concentration.meanResultantLength.toFixed(4)}</td>
      <td>Measures the concentration of arrival times (0-1 scale)</td>
    </tr>
    <tr>
      <td>Concentration Parameter (κ)</td>
      <td>${data.summary.concentration.kappa.toFixed(4)}</td>
      <td>Von Mises distribution parameter, higher values indicate stronger clustering</td>
    </tr>
    <tr>
      <td>Circular Variance</td>
      <td>${data.summary.variance.circularVariance.toFixed(4)}</td>
      <td>Measure of dispersion around the circle (0-1 scale)</td>
    </tr>
    <tr>
      <td>Circular Standard Deviation</td>
      <td>${data.summary.variance.circularStandardDeviation.hours.toFixed(2)} hours</td>
      <td>Angular measure of dispersion in hour units</td>
    </tr>
  `;
  
  // Create variance chart
  createVarianceChart(data.summary.variance, data.summary.concentration);
  
  // Create symmetry table
  const symmetryTable = document.getElementById('symmetryTable');
  symmetryTable.innerHTML = `
    <tr>
      <td>Symmetry Ratio</td>
      <td>${data.summary.symmetry.ratio.toFixed(4)}</td>
      <td>Ratio close to 1 indicates symmetrical distribution around mean direction</td>
    </tr>
    <tr>
      <td>Counts Before Mean</td>
      <td>${data.summary.symmetry.countsBefore}</td>
      <td>Number of observations before the mean direction</td>
    </tr>
    <tr>
      <td>Counts After Mean</td>
      <td>${data.summary.symmetry.countsAfter}</td>
      <td>Number of observations after the mean direction</td>
    </tr>
  `;
}

function createCircularHistogramChart(hourlyData) {
  const ctx = document.getElementById('circularHistogramChart').getContext('2d');
  
  // Extract data and convert to polar coordinates for visualization
  const labels = hourlyData.map(item => item.timeSlot);
  const counts = hourlyData.map(item => item.count);
  
  // Create chart - using radar chart to simulate circular histogram
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Patient Arrivals',
        data: counts,
        backgroundColor: 'rgba(67, 97, 238, 0.5)',
        borderColor: 'rgba(67, 97, 238, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(67, 97, 238, 1)',
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          angleLines: {
            display: true
          },
          ticks: {
            display: false
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Circular Representation of 24-Hour Arrival Distribution'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.label}: ${value} arrivals`;
            }
          }
        }
      }
    }
  });
}

function createVarianceChart(variance, concentration) {
  const ctx = document.getElementById('varianceChart').getContext('2d');
  
  // Create a doughnut chart to visualize variance and concentration
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Concentration', 'Variance'],
      datasets: [{
        data: [concentration.meanResultantLength, variance.circularVariance],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: 'white',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Concentration vs. Variance'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.label}: ${value.toFixed(4)}`;
            }
          }
        }
      }
    }
  });
}

// Utility function to convert time string (like "7:56pm") to decimal hours
function timeStringToDecimal(timeString) {
  // Parse the time string
  const isPM = timeString.toLowerCase().includes('pm');
  const parts = timeString.toLowerCase().replace('am', '').replace('pm', '').split(':');
  
  let hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  
  // Convert to 24-hour format
  if (isPM && hours < 12) {
    hours += 12;
  } else if (!isPM && hours === 12) {
    hours = 0;
  }
  
  // Return decimal hours
  return hours + (minutes / 60);
}

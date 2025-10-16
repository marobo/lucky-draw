// Check status when page loads
window.addEventListener('load', checkStatus);

function showDrawnResult(result) {
  document.getElementById('drawButton').style.display = 'none';
  const resultElement = document.getElementById('result');
  resultElement.style.display = 'block';
  resultElement.innerText = result.concept;
  if(result.color) document.body.style.backgroundColor = result.color;
}

async function checkStatus() {
  // Frontend per-device logic
  const localDraw = localStorage.getItem('conceptDrawResult');
  if (localDraw) {
    const data = JSON.parse(localDraw);
    showDrawnResult(data);
    return;
  }
  
  try {
    const response = await fetch('/status');
    const data = await response.json();
    if (data.drawn) {
      showDrawnResult(data);
      // Save result in localStorage for per-device enforcement
      localStorage.setItem('conceptDrawResult', JSON.stringify({concept: data.concept, color: data.color}));
    }
    // Otherwise, leave the draw button visible
  } catch (err) {
    document.getElementById('result').style.display = 'block';
    document.getElementById('result').innerText = "Error checking status.";
  }
}

async function drawConcept() {
  // If the user already drew on this device, stop here
  if(localStorage.getItem('conceptDrawResult')) {
    const data = JSON.parse(localStorage.getItem('conceptDrawResult'));
    showDrawnResult(data);
    return;
  }
  try {
    const response = await fetch('/draw');
    const data = await response.json();
    if (response.status === 403) {
      document.getElementById('result').style.display = 'block';
      document.getElementById('result').innerText = data.error;
      document.getElementById('drawButton').style.display = 'none';
      return;
    }
    if (data.concept) {
      // Save in localStorage for future visits
      localStorage.setItem('conceptDrawResult', JSON.stringify({concept: data.concept, color: data.color}));
      // Hide button and show result
      showDrawnResult(data);
    } else {
      document.getElementById('result').style.display = 'block';
      document.getElementById('result').innerText = "No more concepts left!";
      document.getElementById('drawButton').style.display = 'none';
    }
  } catch (err) {
    document.getElementById('result').style.display = 'block';
    document.getElementById('result').innerText = "Error drawing concept.";
  }
} 
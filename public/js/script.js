document.addEventListener("DOMContentLoaded", async function () {
  await fetchAndRenderHistory();
});

document
  .getElementById("sentiment-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const text = this.text.value;

    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    renderResults(data.allResults);

    this.reset();
  });

async function fetchAndRenderHistory() {
  try {
    const response = await fetch("/history");
    const data = await response.json();
    renderResults(data.allResults);
  } catch (error) {
    console.error("Error fetching history:", error);
  }
}

function renderResults(results) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  results.forEach((entry, index) => {
    const div = document.createElement("div");
    let sentimentEmoji, sentimentType, explanation, borderColor, buttonClass;

    const score = entry.score;

    if (score >= 0.6) {
      sentimentType = "Very Positive";
      sentimentEmoji = "😁";
      explanation =
        "Strong positive words and expressions indicate enthusiasm or happiness.";
      borderColor = "#2ea043";
      buttonClass = "positive"; 
    } else if (score >= 0.2) {
      sentimentType = "Positive";
      sentimentEmoji = "😊";
      explanation =
        "The presence of positive terms suggests a generally good feeling.";
      borderColor = "#2ea043";
      buttonClass = "positive";
    } else if (score > -0.2 && score < 0.2) {
      sentimentType = "Neutral";
      sentimentEmoji = "😐";
      explanation =
        "The message uses neutral language, showing no strong emotion.";
      borderColor = "#8b949e";
      buttonClass = "neutral"; 
    } else if (score <= -0.2 && score > -0.6) {
      sentimentType = "Negative";
      sentimentEmoji = "😞";
      explanation =
        "Mild negative wording shows some dissatisfaction or concern.";
      borderColor = "#da3633";
      buttonClass = "negative"; 
    } else {
      sentimentType = "Very Negative";
      sentimentEmoji = "😠";
      explanation =
        "Strongly negative words and tone reflect anger, sadness, or frustration.";
      borderColor = "#da3633";
      buttonClass = "negative";
    }

    div.innerHTML = `
      <div class="result-box" style="border-left: 5px solid ${borderColor};">
        <p><strong>Message:</strong> ${entry.text}</p>
        <p><strong>Sentiment:</strong> ${sentimentType} ${sentimentEmoji}</p>
        <button class="explain-btn ${buttonClass}" style="background-color: ${borderColor}" data-index="${index}">Why this classification?</button>
        <div class="explanation" id="explanation-${index}" style="display: none; border: 1px solid ${borderColor};">
          <p><strong>Explanation:</strong> ${explanation}</p>
          <p><strong>Score:</strong> ${score.toFixed(2)}</p>
        </div>
      </div>
    `;

    resultsDiv.appendChild(div);
  });

  document.querySelectorAll(".explain-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const idx = this.dataset.index;
      const explanationDiv = document.getElementById(`explanation-${idx}`);
      explanationDiv.style.display =
        explanationDiv.style.display === "none" ? "block" : "none";
    });
  });
}

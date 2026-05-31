import jsPDF from 'jspdf';

export const downloadScorecard = ({ title = 'Scorecard', analytics = {}, attempt = {} }) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 18);
  doc.setFontSize(11);
  doc.text(`Score: ${analytics.score ?? attempt.score ?? 0}%`, 14, 34);
  doc.text(`Correct: ${analytics.correctAnswers ?? attempt.correctAnswers ?? 0}`, 14, 44);
  doc.text(`Wrong: ${analytics.wrongAnswers ?? attempt.wrongAnswers ?? 0}`, 14, 54);
  doc.text(`Accuracy: ${analytics.accuracy ?? attempt.accuracy ?? 0}%`, 14, 64);
  doc.text(`Percentile: ${analytics.percentile ?? attempt.percentile ?? 0}`, 14, 74);
  let y = 92;
  doc.setFontSize(13);
  doc.text('Topic Analysis', 14, y);
  y += 10;
  doc.setFontSize(10);
  (analytics.topicBreakdown || attempt.topicBreakdown || []).forEach((topic) => {
    doc.text(`${topic.topic}: ${topic.correct}/${topic.total}`, 14, y);
    y += 8;
  });
  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

export const downloadSimpleReport = (title, rows) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  rows.forEach((row, index) => {
    doc.text(row, 14, 34 + index * 8);
  });
  doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};

import React from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

const barColors: { [key: string]: string } = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red'
};

const SeverityDistributionPopup: React.FC<SeverityDistributionPopupProps> = ({ open, onClose, severities }) => {
  // Aggregate the counts for each severity level
  const severityCounts: SeverityCounts = severities.reduce((acc: SeverityCounts, severity) => {
    const severityValue = severity.value.toUpperCase(); // Ensure the value matches the keys in barColors
    acc[severityValue] = (acc[severityValue] || 0) + severity.count;
    return acc;
  }, {});

  // Convert the severityCounts object into an array suitable for the bar chart
  const data = Object.keys(severityCounts).map(severity => ({
    name: severity,
    count: severityCounts[severity]
  }));

  return (
    <Popup open={open} onClose={onClose} modal >
      <div className="popup-content">
        <button className="close" onClick={onClose}>&times;</button>
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColors[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </Popup>
  );
};

export default SeverityDistributionPopup;

import { forwardRef } from "react";

type OverviewSubjectPerformance = {
  subjectId: number;
  name: string;
  shortName: string;
  score: number;
  goal: number;
};

type OverviewRisingStar = {
  subjectId: number;
  name: string;
  shortName: string;
  improvement: number;
  prev: number;
  current: number;
};

type OverviewTopSubject = {
  id: number;
  name: string;
  score: number;
};

type OverviewGradeDistribution = {
  grade: string;
  count: number;
};

export type OverviewReportPrintDocumentProps = {
  schoolLogo: string;
  generatedOnLabel: string;
  examLabel: string;
  currentAverageDisplay: string;
  currentAverage: number;
  currentScoresCount: number;
  bestSubjectLabel: string;
  bestSubjectScoreDisplay: string;
  improvementText: string;
  improvementHasDelta: boolean;
  improvementPoints: number;
  passingCount: number;
  passingTotal: number;
  passingPercentage: number;
  weakestSubjectLabel: string;
  weakestSubjectScoreDisplay: string;
  risingStars: OverviewRisingStar[];
  subjectPerformance: OverviewSubjectPerformance[];
  gradeDistribution: OverviewGradeDistribution[];
  gradeChartColors: Record<string, string>;
  topSubjects: OverviewTopSubject[];
  footerYear: number;
};

export const OverviewReportPrintDocument = forwardRef<
  HTMLDivElement,
  OverviewReportPrintDocumentProps
>(function OverviewReportPrintDocument(
  {
    schoolLogo,
    generatedOnLabel,
    examLabel,
    currentAverageDisplay,
    currentAverage,
    currentScoresCount,
    bestSubjectLabel,
    bestSubjectScoreDisplay,
    improvementText,
    improvementHasDelta,
    improvementPoints,
    passingCount,
    passingTotal,
    passingPercentage,
    weakestSubjectLabel,
    weakestSubjectScoreDisplay,
    risingStars,
    subjectPerformance,
    gradeDistribution,
    gradeChartColors,
    topSubjects,
    footerYear,
  },
  ref
) {
  return (
    <div
      id="pdf-root-export"
      className="pdf-print-root pdf-export-root pdf-exporting"
      ref={ref}
    >
      <div className="pdf-a4-page">
        {/* Report Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "15px",
            paddingBottom: "10px",
            borderBottom: "2px solid #3b82f6",
          }}
        >
          <img
            src={schoolLogo}
            alt="School Logo"
            crossOrigin="anonymous"
            style={{
              width: "40px",
              height: "40px",
              objectFit: "contain",
            }}
          />
          <div style={{ textAlign: "left" }}>
            <h1
              style={{
                fontSize: "16px",
                fontWeight: 700,
                margin: "0 0 2px 0",
              }}
            >
              Academic Overview Report
            </h1>
            <p style={{ fontSize: "10px", color: "#666", margin: 0 }}>
              Student Performance Analysis
            </p>
            <p style={{ fontSize: "9px", color: "#888", margin: "2px 0 0 0" }}>
              Generated on {generatedOnLabel}
              {" \u2022 "}
              {examLabel}
            </p>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {/* Average */}
            <div
              style={{
                padding: "12px 8px",
                borderRadius: "10px",
                backgroundColor: "#dcfce7",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {"\u{1F4D6}"}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#22c55e",
                }}
              >
                {currentAverageDisplay}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#166534",
                  fontWeight: 600,
                }}
              >
                Average
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#166534",
                  marginTop: "2px",
                }}
              >
                {currentScoresCount > 0
                  ? currentAverage >= 80
                    ? "Excellent"
                    : currentAverage >= 60
                    ? "Above Average"
                    : "Needs Improvement"
                  : "N/A"}
              </div>
            </div>
            {/* Best Subject */}
            <div
              style={{
                padding: "12px 8px",
                borderRadius: "10px",
                backgroundColor: "#fef3c7",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {"\u{1F3C6}"}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#d97706",
                }}
              >
                {bestSubjectLabel}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#92400e",
                  fontWeight: 600,
                }}
              >
                Best Subject
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#92400e",
                  marginTop: "2px",
                }}
              >
                {bestSubjectScoreDisplay}
              </div>
            </div>
            {/* Improvement */}
            <div
              style={{
                padding: "12px 8px",
                borderRadius: "10px",
                backgroundColor: "#ccfbf1",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {"\u{1F4C8}"}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#0d9488",
                }}
              >
                {improvementText}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#115e59",
                  fontWeight: 600,
                }}
              >
                Improvement
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#115e59",
                  marginTop: "2px",
                }}
              >
                {improvementHasDelta
                  ? improvementPoints > 0
                    ? "Improved"
                    : improvementPoints < 0
                    ? "Declined"
                    : "Stable"
                  : "N/A"}
              </div>
            </div>
            {/* Attendance */}
            <div
              style={{
                padding: "12px 8px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {"\u{1F4C5}"}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#3b82f6",
                }}
              >
                --
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#1d4ed8",
                  fontWeight: 600,
                }}
              >
                Attendance
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#1d4ed8",
                  marginTop: "2px",
                }}
              >
                Not available
              </div>
            </div>
            {/* Passing */}
            <div
              style={{
                padding: "12px 8px",
                borderRadius: "10px",
                backgroundColor: "#f3e8ff",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {"\u{1F3AF}"}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#9333ea",
                }}
              >
                {passingCount}/{passingTotal}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#6b21a8",
                  fontWeight: 600,
                }}
              >
                Passing
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#6b21a8",
                  marginTop: "2px",
                }}
              >
                {passingPercentage}%
              </div>
            </div>
            {/* Needs Focus */}
            <div
              style={{
                padding: "12px 8px",
                borderRadius: "10px",
                backgroundColor: "#fee2e2",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {"\u26A0\uFE0F"}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#dc2626",
                }}
              >
                {weakestSubjectLabel}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#991b1b",
                  fontWeight: 600,
                  lineHeight: "1.2",
                }}
              >
                Needs
                <br />
                Focus
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#991b1b",
                  marginTop: "2px",
                }}
              >
                {weakestSubjectScoreDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Rising Stars */}
        {risingStars.length > 0 && (
          <div
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)",
              border: "1px solid #fde047",
              marginBottom: "12px",
              pageBreakInside: "avoid",
            }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#ca8a04",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {"\u2B50"} Rising Stars
            </h4>
            <p style={{ fontSize: "8px", color: "#a16207", marginBottom: "8px" }}>
              Top performing subjects
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {risingStars.slice(0, 3).map((item) => (
                <div
                  key={item.subjectId}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #fef08a 0%, #fde047 100%)",
                    border: "1px solid rgba(253, 224, 71, 0.6)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "9px", fontWeight: 600, color: "#713f12" }}>
                    {item.shortName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div
                      style={{ fontSize: "11px", fontWeight: 700, color: "#a16207" }}
                    >
                      +{item.improvement}%
                    </div>
                    <div style={{ fontSize: "7px", color: "#854d0e" }}>
                      {item.prev}%{"\u2192"}
                      {item.current}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Performance */}
        <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              paddingBottom: "4px",
              borderBottom: "1px solid #ddd",
            }}
          >
            Subject Performance
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "6px",
            }}
          >
            {subjectPerformance.map((sub, idx) => (
              <div
                key={sub.subjectId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  backgroundColor:
                    idx < 3
                      ? "#dcfce7"
                      : idx >= subjectPerformance.length - 3
                      ? "#fee2e2"
                      : "#f5f5f5",
                  borderRadius: "4px",
                  fontSize: "10px",
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  {idx + 1}. {sub.name}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      sub.score >= 80
                        ? "#22c55e"
                        : sub.score >= 50
                        ? "#3b82f6"
                        : "#ef4444",
                  }}
                >
                  {sub.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Performance Bar Chart */}
        <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              paddingBottom: "4px",
              borderBottom: "1px solid #ddd",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {"\u{1F4CA}"} Performance Chart
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {subjectPerformance.map((sub, index) => {
              const barColors = [
                "#3b82f6",
                "#f59e0b",
                "#10b981",
                "#8b5cf6",
                "#ef4444",
                "#06b6d4",
                "#ec4899",
                "#84cc16",
              ];
              const barColor = barColors[index % barColors.length];
              return (
                <div
                  key={sub.subjectId}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "80px",
                      fontSize: "8px",
                      fontWeight: 500,
                      color: "#374151",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {sub.shortName}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: "14px",
                      background: "#f3f4f6",
                      borderRadius: "4px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Score bar */}
                    <div
                      style={{
                        width: `${sub.score}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: "4px",
                      }}
                    />
                    {/* Goal marker */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${sub.goal}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "8px",
                        height: "8px",
                        background: "#1a1a1a",
                        borderRadius: "50%",
                        border: "1.5px solid white",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: "35px",
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {sub.score}%
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "20px",
                  height: "8px",
                  background: "#3b82f6",
                  borderRadius: "2px",
                }}
              />
              <span style={{ fontSize: "7px", color: "#6b7280" }}>Score</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#1a1a1a",
                  borderRadius: "50%",
                  border: "1px solid #d1d5db",
                }}
              />
              <span style={{ fontSize: "7px", color: "#6b7280" }}>Goal</span>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "8px",
              paddingBottom: "4px",
              borderBottom: "1px solid #ddd",
            }}
          >
            Grade Distribution
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "6px",
            }}
          >
            {gradeDistribution.map((item) => (
              <div
                key={item.grade}
                style={{
                  textAlign: "center",
                  padding: "8px 4px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: gradeChartColors[item.grade],
                  }}
                >
                  {item.grade}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                  }}
                >
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Subjects */}
        <div style={{ marginBottom: "12px", pageBreakInside: "avoid" }}>
          <div
            style={{
              padding: "10px",
              borderRadius: "6px",
              backgroundColor: "#dcfce7",
              border: "1px solid #86efac",
            }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#16a34a",
                marginBottom: "6px",
              }}
            >
              Top Subjects
            </h4>
            {topSubjects.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 6px",
                  fontSize: "9px",
                  borderBottom: "1px solid #86efac40",
                }}
              >
                <span>
                  {index + 1}. {item.name}
                </span>
                <span style={{ fontWeight: 600 }}>{item.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: "8px",
            color: "#666",
            marginTop: "15px",
            paddingTop: "8px",
            borderTop: "1px solid #ddd",
          }}
        >
          <p>This report was generated automatically by the School Management System</p>
          <p>
            {"\u00A9"} {footerYear} All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
});

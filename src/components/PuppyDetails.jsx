import { formatKey, formatValue } from "../utils";

function PuppyDetails({ details, genderColor, isAvailableSoon = false }) {
  if (!details) return null;
  const { litterDescription, facts, available, ...fields } = details;
  const statEntries = Object.entries(fields);
  const isGrid = statEntries.length > 5;

  let statusClass = "status-badge status-adopted";
  let statusLabel = "Adopted";
  if (isAvailableSoon) { statusClass = "status-badge status-available-soon"; statusLabel = "Available Soon"; }
  else if (available) { statusClass = "status-badge status-available"; statusLabel = "Available"; }

  return (
    <div
      className={`puppy-details${isGrid ? " puppy-details--grid" : ""}`}
      style={genderColor ? { "--gender-color": genderColor } : undefined}
    >
      <div className="details-top-bar" />
      <div className="details-body">
        <div className={isGrid ? "details-grid" : "details-stats"}>
          {statEntries.map(([key, value]) => (
            <div className={isGrid ? "details-grid-item" : "details-stat"} key={key}>
              {isGrid ? (
                <>
                  <span className="details-stat-label">{formatKey(key)}</span>
                  <span className="details-stat-value">{formatValue(key, value)}</span>
                </>
              ) : (
                <div className="details-stat-inner">
                  <span className="details-stat-label">{formatKey(key)}</span>
                  {key === "sex" && genderColor && value ? (
                    <span className="sex-pill">{String(value)}</span>
                  ) : (
                    <span className="details-stat-value" title={formatValue(key, value)}>{formatValue(key, value)}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {!isGrid && available != null && (
          <span className={statusClass}>{statusLabel}</span>
        )}
      </div>
      {(facts?.length > 0 || litterDescription) && (
        <div className="litter-info">
          {facts?.length > 0 && (
            <>
              <h4 className="breed-facts-heading">Key Breed Facts</h4>
              <ul className="breed-facts-list">
                {facts.map((fact) => (
                  <li key={fact} className="breed-facts-item">{fact}</li>
                ))}
              </ul>
            </>
          )}
          {litterDescription && (
            <p className="litter-description">{litterDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default PuppyDetails;

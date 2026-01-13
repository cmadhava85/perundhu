// Example integration in your search results component

import { useTerminalResolution } from '@/hooks/queries/useTerminalResolution';
import { TerminalInfoAlert } from '@/components/TerminalInfoAlert';

export const BusSearchResults = ({ from, to }) => {
  // Resolve terminal before showing results
  const { data: terminalInfo } = useTerminalResolution(from, to);

  return (
    <div>
      {/* Show terminal info if needed */}
      {terminalInfo?.needsTerminalInfo && terminalInfo.terminal && (
        <TerminalInfoAlert terminal={terminalInfo.terminal} />
      )}

      {/* Rest of search results */}
      <div className="bus-results">
        {/* Your existing bus list */}
      </div>
    </div>
  );
};

interface DateDividerProps {
  date: string;
}

/**
 * Date separator for chat messages
 * Shows "Hoje", "Ontem", or formatted date
 */
export const DateDivider = ({ date }: DateDividerProps) => {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
        {date}
      </div>
    </div>
  );
};

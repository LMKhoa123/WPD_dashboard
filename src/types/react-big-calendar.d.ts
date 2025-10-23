declare module 'react-big-calendar' {
  export const Calendar: any
  export const Views: any
  export type DateLocalizer = any
  export function dateFnsLocalizer(args: any): DateLocalizer
}

declare module 'react-big-calendar/lib/addons/dragAndDrop' {
  const withDragAndDrop: any
  export default withDragAndDrop
  export { withDragAndDrop }
}

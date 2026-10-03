import { Modal } from "./Modal.jsx";
import { scheduleLabel } from "../../lib/schedule.js";



/* Generic "are you sure?" sheet: sign out, joining a team/club, reserving a free spot, joining a waitlist. */
export function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} size="sm">
      <div className="p-6 pt-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {body && <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={onCancel} autoFocus className="u-btn rounded-xl py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className={`u-btn rounded-xl py-3 text-sm font-semibold text-white ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"}`}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
export function LeaveConfirm({ club: c, pending, onConfirm, onCancel }) {
  const kind = c.category === "Sports" ? "team" : "club";
  return (
    <Modal onClose={onCancel} size="sm">
      <div className="p-6 pt-8 text-center">
        <span className="u-pop mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl ring-1 ring-inset ring-rose-200">{c.emoji}</span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">{pending ? "Cancel your sign-up?" : `Leave this ${kind}?`}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {pending
            ? <>Your pending sign-up for <span className="font-semibold text-slate-900">{c.name}</span> will be cancelled and its sessions removed from My Schedule. To rejoin, you'd submit the UOWD form again.</>
            : <>You'll leave <span className="font-semibold text-slate-900">{c.name}</span> and its weekly sessions ({scheduleLabel(c, true)}) will be removed from My Schedule.</>}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={onCancel} autoFocus className="u-btn rounded-xl py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">{pending ? "Keep it" : "Stay"}</button>
          <button onClick={onConfirm} className="u-btn rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700">{pending ? "Cancel sign-up" : `Leave ${kind}`}</button>
        </div>
      </div>
    </Modal>
  );
}

import { useContext } from "react";
import { Context } from "../main";
import { PiShieldWarning } from "react-icons/pi";

const RestrictedAccess = ({ title = "Verification Required", message = "Your account is pending admin verification. You cannot access this feature yet." }) => {
  const { theme } = useContext(Context);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 text-center rounded-2xl ${theme === "dark" ? "bg-slate-900/50 border border-white/5" : "bg-white border border-slate-200 shadow-sm"}`}>
      <div className={`p-4 rounded-full mb-6 ${theme === "dark" ? "bg-amber-500/10 text-amber-500" : "bg-amber-50 text-amber-600"}`}>
        <PiShieldWarning size={48} />
      </div>
      <h2 className={`text-2xl font-bold mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
        {title}
      </h2>
      <p className={`max-w-md ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
        {message}
      </p>
      <div className={`mt-8 px-6 py-4 rounded-lg text-sm text-left max-w-md w-full ${theme === "dark" ? "bg-sky-500/10 text-sky-200 border border-sky-500/20" : "bg-sky-50 text-sky-800 border border-sky-200"}`}>
        <span className="font-semibold block mb-1">What happens next?</span>
        An administrator will review your account details. Once verified, this section will automatically unlock and you'll have full access to the portal's features.
      </div>
    </div>
  );
};

export default RestrictedAccess;

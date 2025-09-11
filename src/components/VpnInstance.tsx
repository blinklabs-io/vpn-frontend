interface VpnInstanceProps {
  region: string
  duration: string
  status: "Active" | "Expired"
  expires: string
  onDelete?: () => void
  onAction?: () => void
}

const VpnInstance = ({ region, duration, status, expires, onAction }: VpnInstanceProps) => {
  return (
    <div className={`flex p-4 flex-col justify-center items-start gap-3 w-full rounded-md backdrop-blur-xs ${
        status === "Active"
          ? "bg-[linear-gradient(180deg,rgba(148,0,255,0.60)_0%,rgba(104,0,178,0.60)_100%)]"
          : "bg-[rgba(255,255,255,0.20)]"
      }`}>
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex justify-between items-start w-full gap-2">
          <p className="text-sm md:text-base">Region: {region}</p>
          <p className="text-sm md:text-base">Duration: {duration}</p>
        </div>
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-2">
            <p className="text-sm md:text-base">Status: {status}</p>
            <span className={`w-2 h-2 rounded-full ${status === "Active" ? "bg-[#86EA64]" : "bg-red-500"}`}></span>
          </div>
          <p className="text-sm md:text-base">Expires: {expires}</p>
        </div>
      </div>
      <div className="flex justify-end items-center w-full">
        <button
          className="flex items-center justify-center gap-3 rounded-md py-1.5 px-3.5 backdrop-blur-xs box-shadow-sm cursor-pointer bg-white text-black"
          onClick={onAction}
        >
          <p className="font-light text-black text-sm">
            {status === "Active" ? "Get Config" : "Renew Access"}
          </p>
        </button>
      </div>
    </div>
  )
}

export default VpnInstance
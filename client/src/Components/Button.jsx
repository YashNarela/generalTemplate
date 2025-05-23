export function Button({ children, variant = "default", ...props }) {
    const base = "px-4 py-2 rounded-xl font-medium shadow";
    const styles = {
        default: "bg-blue-600 text-white",
        outline: "border border-gray-400 text-gray-700 bg-white",
        success: "bg-green-600 text-white",
    };
    return (
        <button className={`${base} ${styles[variant] || ""}`} {...props}>
            {children}
        </button>
    );
}
  
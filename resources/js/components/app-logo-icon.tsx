export default function AppLogoIcon({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/logo.jpg"
            alt="VCFWizard"
            className={className}
            {...props}
        />
    );
}

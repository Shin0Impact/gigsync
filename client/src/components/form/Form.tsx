import type { FormHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./Form.module.css";

interface FormRootProps extends FormHTMLAttributes<HTMLFormElement> {
	title?: string;
	header?: ReactNode;
	children: ReactNode;
}

function FormRoot({ title, header, children, className = "", ...props }: FormRootProps) {
	return (
		<div className={styles.formWrapper}>
			{header}
			<div className={styles.formBody}>
				{title && <h1 className={styles.title}>{title}</h1>}
				<form
					className={`${styles.form} ${className}`.trim()}
					action=""
					method="post"
					{...props}>
					{children}
				</form>
			</div>
		</div>
	);
}

interface HeaderProps {
	left?: ReactNode;
	center?: ReactNode;
	right?: ReactNode;
}

function Header({ left, center, right }: HeaderProps) {
	return (
		<header className={styles.formHeader}>
			<div className={styles.left}>{left}</div>
			<div className={styles.center}>{center}</div>
			<div className={styles.right}>{right}</div>
		</header>
	);
}

function Field({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`${styles.field} ${className}`.trim()}>{children}</div>;
}

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
	return (
		<label
			htmlFor={htmlFor}
			className={styles.label}>
			{children}
		</label>
	);
}

function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={`${styles.input} ${className}`.trim()}
			{...props}
		/>
	);
}

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	file: File | null;
	buttonText?: string;
}

function FileInput({ id, file, buttonText = "Choose File", onChange, disabled, className = "", ...props }: FileInputProps) {
	return (
		<div>
			<input
				id={id}
				type="file"
				className={styles.fileInputHidden}
				onChange={onChange}
				disabled={disabled}
				{...props}
			/>
			<label
				htmlFor={id}
				className={`${styles.fileInputLabel} ${file ? styles.fileInputHasFile : ""} ${className}`.trim()}>
				{file ? `✓ ${file.name}` : buttonText}
			</label>
		</div>
	);
}

function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
	return (
		<textarea
			className={`${styles.textarea || styles.input} ${className}`.trim()}
			{...props}
		/>
	);
}

function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
	return (
		<select
			className={`${styles.select || styles.input} ${className}`.trim()}
			{...props}>
			{children}
		</select>
	);
}

function ButtonRow({ children }: { children: ReactNode }) {
	return <div className={styles.buttonRow}>{children}</div>;
}

interface OptionGroupProps<T extends string> {
	options: readonly { label: string; value: T }[];
	value: T | "";
	onChange: (value: T) => void;
}

function OptionGroup<T extends string>({ options, value, onChange }: OptionGroupProps<T>) {
	return (
		<div className={styles.buttonRow}>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					className={`${styles.optionButton} ${value === option.value ? styles.activeOption : ""}`.trim()}
					onClick={() => onChange(option.value)}>
					{option.label}
				</button>
			))}
		</div>
	);
}

function ErrorMessage({ children }: { children: ReactNode }) {
	return (
		<p
			className={styles.fieldError}
			role="alert">
			{children}
		</p>
	);
}

function Submit({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="submit"
			className={`${styles.submitButton} ${className}`.trim()}
			{...props}>
			{children}
		</button>
	);
}

function ToggleButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className={`${styles.toggleButton} ${className}`.trim()}
			{...props}>
			{children}
		</button>
	);
}

export const Form = Object.assign(FormRoot, {
	Header,
	Field,
	Label,
	Input,
	FileInput,
	TextArea,
	Select,
	ButtonRow,
	OptionGroup,
	ErrorMessage,
	Submit,
	ToggleButton,
});

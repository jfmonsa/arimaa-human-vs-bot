import Styles from "./Button.module.css";

interface ButtonProps {
  onClick: () => void;
  children: string;
}

export function Button(props: ButtonProps) {
  const { children } = props;
  return (
    <button className={Styles.button} {...props}>
      {children}
    </button>
  );
}

import { Metaballs } from "@paper-design/shaders-react";

function Placeholder() {
	return (
		<Metaballs
			width={"auto"}
			height={"auto"}
			colors={["#f3d66d"]}
			colorBack="#00000000"
			count={20}
			size={0.72}
			speed={1}
			scale={2}
		/>
	);
}

export default Placeholder;

import { Button } from "../../components/Button";
import styles from "./Hero.module.css";
import { Voronoi } from "@paper-design/shaders-react";

function Hero() {
	return (
		<section className={styles.hero}>
			<div className={styles.heroShaderWrapper}>
				<Voronoi
					width={"auto"}
					height={"100vh"}
					colors={["#fafafa"]}
					colorGap="#272727"
					stepsPerColor={1}
					distortion={0.33}
					gap={0.02}
					glow={0}
					speed={0}
					scale={0.27}
				/>
			</div>

			<div className={styles.heroContent}>
				<h1 className={styles.heroTitle}>The process as a centerpiece.</h1>
				<p className={styles.heroSubtitle}>
					Document your creative process alongside fellow creatives from various mediums,
					collaborate, and exchange feedback.
				</p>

				<Button>See our journey</Button>
			</div>
		</section>
	);
}

export default Hero;

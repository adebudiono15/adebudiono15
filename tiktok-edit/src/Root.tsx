import { Composition } from "remotion";
import { TikTokAffiliate } from "./TikTokAffiliate";
import { CoverArt } from "./Cover";
import plan from "./plan.json";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TikTokAffiliate"
      component={TikTokAffiliate}
      width={1080}
      height={1920}
      fps={plan.fps}
      durationInFrames={plan.durationInFrames}
    />
    <Composition id="Cover" component={CoverArt} width={1080} height={1920} fps={plan.fps} durationInFrames={1} />
  </>
);

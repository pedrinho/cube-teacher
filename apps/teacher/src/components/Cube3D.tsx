// cube-kit's 3D cube, turning at the speed picked in the settings.
import { Cube3D as KitCube3D, type Cube3DProps } from "cube-kit/react/Cube3D";
import { SPEEDS, useSettings } from "../settings";

export type { Cube3DHandle } from "cube-kit/react/Cube3D";

export function Cube3D(props: Cube3DProps) {
  const { speed } = useSettings();
  return <KitCube3D timing={SPEEDS[speed]} {...props} />;
}

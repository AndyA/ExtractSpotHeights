"use strict";

import ReactDOM from "react-dom";
import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree, extend } from "react-three-fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Delaunator from "delaunator";

import survey from "../../ref/points";

extend({ OrbitControls });

class SurveyScene {
  constructor(scene) {
    this.scene = scene;
  }

  get points() {
    return (this._points =
      this._points ||
      this.scene.map(pt => new THREE.Vector3(pt.x, pt.y, pt.z)));
  }

  get geom() {
    return (this._geom =
      this._geom ||
      new THREE.BufferGeometry().setFromPoints(this.points).center());
  }

  get surface() {
    return (this._surface =
      this._surface ||
      (() => {
        const id = Delaunator.from(this.points.map(v => [v.x, v.z]));
        const surf = new THREE.BufferGeometry().setFromPoints(this.points);
        surf.setIndex(Array.from(id.triangles));
        surf.computeVertexNormals();
        surf.center();
        return surf;
      })());
  }
}

function Sandbox(props) {
  const { showPoints, showSurface, ...rest } = props;
  const ss = new useMemo(() => new SurveyScene(survey));
  //        <meshStandardMaterial attach="material" color="orange" />

  return (
    <group scale={[0.2, 0.2, 0.2]}>
      {showPoints && (
        <points geometry={ss.geom}>
          <pointsMaterial
            attach="material"
            args={{ color: 0x00cc44, size: 0.1 }}
          />
        </points>
      )}
      {showSurface && (
        <mesh geometry={ss.surface}>
          <meshLambertMaterial
            attach="material"
            color="purple"
            wireframe={true}
          />
        </mesh>
      )}
    </group>
  );
}

function Controls(props) {
  const ref = useRef();
  const { gl, camera } = useThree();
  //  useFrame(() => ref.current.object.update());
  return <orbitControls ref={ref} args={[camera, gl.domElement]} />;
}

function Viewer(props) {
  const canvas = useRef();
  const controls = useRef();
  const { camera } = useThree();
  //      <orbitControls ref={controls} args={[canvas, camera]} />
  return (
    <Canvas>
      <Controls />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Sandbox position={[0, 0, 0]} showPoints showSurface />
    </Canvas>
  );
}

ReactDOM.render(<Viewer />, document.getElementById("app"));

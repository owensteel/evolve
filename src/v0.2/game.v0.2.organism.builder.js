/*

    Organism builder

*/

import * as THREE from 'three';

const defaultMeshSize = 1;
const defaultSpread = 1.5;

// Recursively collect positions of all appendage/root nodes

function gatherNodePositions(
    currentNode,
    allowDetachingParts = false,
    x = 0,
    y = 0,
    level = 0,
    angleStart = -Math.PI,
    angleEnd = Math.PI,
    positionsArray = []
) {
    // If node is "appendage" or "root", record its position
    if (currentNode.role !== "appendage" && currentNode.role !== "root") {
        // Cannot be added to union
        return
    }

    if (currentNode.detach == true && !allowDetachingParts) {
        // Do not add entirety of detaching node
        return
    }

    positionsArray.push({ x, y, z: 0, detach: (currentNode.detach == true), node: currentNode });

    // If there are children, distribute them radially
    if (currentNode.offshoots && currentNode.offshoots.length > 0) {
        const childCount = currentNode.offshoots.length;
        const angleSlice = (angleEnd - angleStart) / childCount;

        for (let i = 0; i < childCount; i++) {
            const child = currentNode.offshoots[i];
            const childAngle = angleStart + angleSlice * (i + 0.5);

            // Convert polar to cartesian
            const childX = x + defaultSpread * Math.cos(childAngle);
            const childY = y + defaultSpread * Math.sin(childAngle);

            const subAngleStart = angleStart + angleSlice * i;
            const subAngleEnd = angleStart + angleSlice * (i + 1);

            gatherNodePositions(
                child,
                allowDetachingParts,
                childX,
                childY,
                level + 1,
                subAngleStart,
                subAngleEnd,
                positionsArray
            );
        }
    }

    return positionsArray;
}

function buildSeamlessBodyFromNodes(rootNodeUncloned, allowDetachingParts = false) {
    // Clone to prevent detachment caching from entering original input
    const newRootNode = {
        role: "root",
        color: rootNodeUncloned.color,
        offshoots: []
    }

    // Directional symmetry 
    for (let dirI = 0; dirI < 4; dirI++) {
        const rootNodeClone = JSON.parse(JSON.stringify(rootNodeUncloned))
        newRootNode.offshoots.push(rootNodeClone)
    }

    // Collect all node positions
    const positions = gatherNodePositions(newRootNode, allowDetachingParts);

    if (positions.length === 0) {
        // No appendage/root nodes
        return null;
    }

    // Clear union
    let meshUnion = null;

    // For each position, build a sphere mesh

    positions.forEach((pos) => {
        // Don't add detaching parts to the union
        if (pos.detach && !allowDetachingParts) {
            return
        }

        const sphereGeom = new THREE.SphereGeometry(
            defaultMeshSize,
            4,
            2
        );
        const sphereMat = new THREE.MeshBasicMaterial({ color: newRootNode.color });
        const sphereMesh = new THREE.Mesh(sphereGeom, sphereMat);
        sphereMesh.position.set(pos.x, pos.y, pos.z);
        sphereMesh.scale.z = 0.05
        sphereMesh.updateMatrix();

        if (!meshUnion) {
            // First shape
            meshUnion = sphereMesh;
        } else {
            // Union with the accumulated shape
            meshUnion.add(sphereMesh)
        }
    });

    return meshUnion;
}

export { buildSeamlessBodyFromNodes, gatherNodePositions }
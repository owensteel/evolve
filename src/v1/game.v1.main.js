/*

    Main

*/

import { BLOCK_TYPENAME_HEART } from "./game.v1.blocks"
import DNA from "./game.v1.dna"
import Pool from "./game.v1.pool"
import { DNA_NODE_ROLE_ROOT, UPDATES_PER_SEC } from "./game.v1.references"
import DNABuilderUI from "./game.v1.dna.builder.ui"
import MultiplayerClient from "./game.v1.multiplayerClient"

const defaultDNA = new DNA(
    DNA_NODE_ROLE_ROOT,
    BLOCK_TYPENAME_HEART,
    [
        new DNA(),
        new DNA(),
        new DNA(),
        new DNA(),
        new DNA(),
        new DNA()
    ]
)

class Main {
    constructor(
        presetPoolData,
        multiplayerClient
    ) {
        // Multiplayer (if provided)
        this.multiplayerClient = multiplayerClient
        if (multiplayerClient && !(multiplayerClient instanceof MultiplayerClient)) {
            throw new Error("If in multiplayer mode, the Multiplayer Client must be provided")
        }

        // Setup pool
        this.presetPoolData = presetPoolData

        // Grab canvas
        this.gameWrapper = document.getElementById("game-wrapper")

        // Create or open Pool
        if (this.presetPoolData) {
            this.currentPool = new Pool(
                this.presetPoolData.id,
                this.presetPoolData.organisms,
                this.presetPoolData.timeSync,
                !(!this.multiplayerClient)
            )
        } else {
            this.currentPool = new Pool(
                null,
                [],
                null,
                !(!this.multiplayerClient)
            )
        }

        // Init Builder UI
        this.builderUi = new DNABuilderUI(
            defaultDNA,
            this.currentPool,
            this.multiplayerClient
        )

        // Init all
        this.init()
        this.displayUI()
    }
    init() {
        const currentPool = this.currentPool

        // TODO: REMOVE, debugging only

        window.cL = this
        console.log(window.cL)

        // Rendering
        // Offline only; in multiplayer mode, only the host
        // renders and the clients are updated to its state

        if (!this.multiplayerClient) {
            const renderUpdateLoop = () => {
                // Update
                currentPool.updateLife()
                setTimeout(() => {
                    renderUpdateLoop()
                }, 1000 / UPDATES_PER_SEC)
            }
            renderUpdateLoop()
        }
    }
    displayUI() {
        // Set up Builder UI

        this.gameWrapper.appendChild(this.builderUi.builderWrapper)
        this.builderUi.initDOM()

        // Display game status

        const statusBar = document.createElement("game-status-bar")
        // TODO: Provide string constants
        if (!this.multiplayerClient) {
            statusBar.innerHTML = "<status-mode>OFFLINE</status-mode>: Sandbox"
        } else {
            statusBar.innerHTML = `<status-mode>ONLINE</status-mode>: ${this.currentPool.id}`
        }
        this.gameWrapper.appendChild(statusBar)
    }
}

export default Main
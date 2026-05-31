import React, {useState} from "react";

import "./Demos.css";
import "./components/layouts/layouts-theme.css";

import {Modal} from "./components/layouts/modal/modal/Modal";
import {ModalHeader} from "./components/layouts/modal/modal-header/ModalHeader";
import {ModalBody} from "./components/layouts/modal/modal-body/ModalBody";
import {ModalDescription} from "./components/layouts/modal/modal-description/ModalDescription";
import {ModalFooter} from "./components/layouts/modal/modal-footer/ModalFooter";
import {ModalFooterLeft} from "./components/layouts/modal/modal-footer-left/ModalFooterLeft";
import {ModalFooterRight} from "./components/layouts/modal/modal-footer-right/ModalFooterRight";

import {Drawer, DrawerPosition} from "./components/layouts/drawer/drawer/Drawer";
import {DrawerHeader} from "./components/layouts/drawer/drawer-header/DrawerHeader";
import {DrawerBody} from "./components/layouts/drawer/drawer-body/DrawerBody";
import {DrawerDescription} from "./components/layouts/drawer/drawer-description/DrawerDescription";
import {DrawerFooter} from "./components/layouts/drawer/drawer-footer/DrawerFooter";
import {DrawerFooterLeft} from "./components/layouts/drawer/drawer-footer-left/DrawerFooterLeft";
import {DrawerFooterRight} from "./components/layouts/drawer/drawer-footer-right/DrawerFooterRight";

export const LayoutsDemo: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [drawerPosition, setDrawerPosition] = useState<DrawerPosition | null>(null);

    return (
        <div className="demo-page">
            <h1 className="demo-title">Modal &amp; Drawer</h1>
            <p className="demo-subtitle">
                Overlay layouts copied from @blue-orange-ai/foundations-core. Both close on
                backdrop click or the header's close button.
            </p>

            <section className="demo-card">
                <h2>Modal</h2>
                <p className="demo-card-hint">
                    Header + description + body + a split footer (left/right action groups).
                </p>
                <button className="demo-btn" onClick={() => setShowModal(true)}>
                    Open modal
                </button>
            </section>

            <section className="demo-card">
                <h2>Drawer</h2>
                <p className="demo-card-hint">
                    Slides in from any edge. Pick a position to open it.
                </p>
                <div className="demo-row">
                    <button className="demo-btn" onClick={() => setDrawerPosition(DrawerPosition.LEFT)}>
                        Left
                    </button>
                    <button className="demo-btn" onClick={() => setDrawerPosition(DrawerPosition.RIGHT)}>
                        Right
                    </button>
                    <button className="demo-btn" onClick={() => setDrawerPosition(DrawerPosition.TOP)}>
                        Top
                    </button>
                    <button className="demo-btn" onClick={() => setDrawerPosition(DrawerPosition.BOTTOM)}>
                        Bottom
                    </button>
                </div>
            </section>

            {showModal && (
                <Modal width={480} minHeight={220} onClose={() => setShowModal(false)}>
                    <ModalHeader label="Edit profile" onClose={() => setShowModal(false)} />
                    <ModalDescription description="Update your account details below." />
                    <ModalBody>
                        <p style={{margin: 0, lineHeight: 1.6}}>
                            This is the modal body. Drop any content here &mdash; forms,
                            text, tables. The card grows with its content down to the
                            configured <code>minHeight</code>.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <ModalFooterLeft>
                            <button className="demo-btn danger">Delete</button>
                        </ModalFooterLeft>
                        <ModalFooterRight>
                            <button className="demo-btn secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="demo-btn" onClick={() => setShowModal(false)}>
                                Save
                            </button>
                        </ModalFooterRight>
                    </ModalFooter>
                </Modal>
            )}

            {drawerPosition !== null && (
                <Drawer
                    position={drawerPosition}
                    width="420px"
                    height="320px"
                    onClose={() => setDrawerPosition(null)}
                >
                    <DrawerHeader label="Filters" onClose={() => setDrawerPosition(null)} />
                    <DrawerDescription description="Refine the results shown in the table." />
                    <DrawerBody>
                        <p style={{lineHeight: 1.6}}>
                            The drawer body scrolls independently when its content overflows.
                            Use it for navigation, filters, or detail panels.
                        </p>
                    </DrawerBody>
                    <DrawerFooter>
                        <DrawerFooterLeft>
                            <button className="demo-btn secondary" onClick={() => setDrawerPosition(null)}>
                                Reset
                            </button>
                        </DrawerFooterLeft>
                        <DrawerFooterRight>
                            <button className="demo-btn" onClick={() => setDrawerPosition(null)}>
                                Apply
                            </button>
                        </DrawerFooterRight>
                    </DrawerFooter>
                </Drawer>
            )}
        </div>
    );
};

export default LayoutsDemo;

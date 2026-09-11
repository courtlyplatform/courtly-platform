"use client";

import {
    ChangeEvent,
    PointerEvent,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useI18n,
} from "@/shared/i18n/I18nProvider";

import {
    uploadAvatar,
} from "@/modules/auth/actions";


type AvatarEditorProps = {
    avatarUrl: string | null;
    fullName: string;
    initials: string;
};


type Position = {
    x: number;
    y: number;
};


const PREVIEW_SIZE = 320;
const OUTPUT_SIZE = 512;


export function AvatarEditor({
    avatarUrl,
    fullName,
    initials,
}: AvatarEditorProps) {
    const fileInputRef =
        useRef<HTMLInputElement>(
            null
        );

    const {
        dictionary,
    } = useI18n();

    const t =
        dictionary
            .profile
            .avatar;

    const uploadInputRef =
        useRef<HTMLInputElement>(
            null
        );

    const uploadFormRef =
        useRef<HTMLFormElement>(
            null
        );

    const imageRef =
        useRef<HTMLImageElement>(
            null
        );

    const dragStartRef =
        useRef<{
            pointerX: number;
            pointerY: number;
            imageX: number;
            imageY: number;
        } | null>(null);

    const [
        editorOpen,
        setEditorOpen,
    ] =
        useState(false);

    const [
        selectedImageUrl,
        setSelectedImageUrl,
    ] =
        useState<string | null>(
            null
        );

    const [
        selectedFileName,
        setSelectedFileName,
    ] =
        useState(
            "avatar"
        );

    const [
        zoom,
        setZoom,
    ] =
        useState(1);

    const [
        position,
        setPosition,
    ] =
        useState<Position>({
            x: 0,
            y: 0,
        });

    const [
        imageSize,
        setImageSize,
    ] =
        useState({
            width: 0,
            height: 0,
        });

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        localError,
        setLocalError,
    ] =
        useState<string | null>(
            null
        );


    useEffect(() => {
        return () => {
            if (
                selectedImageUrl
            ) {
                URL.revokeObjectURL(
                    selectedImageUrl
                );
            }
        };
    }, [selectedImageUrl]);


    useEffect(() => {
        if (!editorOpen) {
            return;
        }

        function handleEscape(
            event: KeyboardEvent
        ) {
            if (
                event.key ===
                "Escape" &&
                !saving
            ) {
                closeEditor();
            }
        }

        document.addEventListener(
            "keydown",
            handleEscape
        );

        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style
            .overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );

            document.body.style
                .overflow =
                previousOverflow;
        };
    }, [
        editorOpen,
        saving,
    ]);


    function getBaseScale() {
        if (
            !imageSize.width ||
            !imageSize.height
        ) {
            return 1;
        }

        return Math.max(
            PREVIEW_SIZE /
                imageSize.width,

            PREVIEW_SIZE /
                imageSize.height
        );
    }


    function clampPosition(
        nextPosition: Position,
        nextZoom = zoom
    ): Position {
        if (
            !imageSize.width ||
            !imageSize.height
        ) {
            return nextPosition;
        }

        const scale =
            getBaseScale() *
            nextZoom;

        const renderedWidth =
            imageSize.width *
            scale;

        const renderedHeight =
            imageSize.height *
            scale;

        const maxX =
            Math.max(
                0,
                (
                    renderedWidth -
                    PREVIEW_SIZE
                ) / 2
            );

        const maxY =
            Math.max(
                0,
                (
                    renderedHeight -
                    PREVIEW_SIZE
                ) / 2
            );

        return {
            x: Math.min(
                maxX,
                Math.max(
                    -maxX,
                    nextPosition.x
                )
            ),

            y: Math.min(
                maxY,
                Math.max(
                    -maxY,
                    nextPosition.y
                )
            ),
        };
    }


    function handleChoosePhoto() {
        setLocalError(
            null
        );

        fileInputRef.current
            ?.click();
    }


    function handleFileChange(
        event:
            ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target
                .files?.[0];

        event.target.value =
            "";

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {
            setLocalError(
                t.errors.invalidType
            );

            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            setLocalError(
                t.errors.originalTooLarge
            );

            return;
        }

        if (
            selectedImageUrl
        ) {
            URL.revokeObjectURL(
                selectedImageUrl
            );
        }

        const objectUrl =
            URL.createObjectURL(
                file
            );

        setSelectedFileName(
            file.name
        );

        setSelectedImageUrl(
            objectUrl
        );

        setZoom(1);

        setPosition({
            x: 0,
            y: 0,
        });

        setImageSize({
            width: 0,
            height: 0,
        });

        setLocalError(
            null
        );

        setEditorOpen(
            true
        );
    }


    function handleImageLoad() {
        const image =
            imageRef.current;

        if (!image) {
            return;
        }

        setImageSize({
            width:
                image.naturalWidth,

            height:
                image.naturalHeight,
        });

        setPosition({
            x: 0,
            y: 0,
        });
    }


    function handleZoomChange(
        event:
            ChangeEvent<HTMLInputElement>
    ) {
        const nextZoom =
            Number(
                event.target.value
            );

        setZoom(
            nextZoom
        );

        setPosition(
            (current) =>
                clampPosition(
                    current,
                    nextZoom
                )
        );
    }


    function handlePointerDown(
        event:
            PointerEvent<HTMLDivElement>
    ) {
        if (saving) {
            return;
        }

        event.currentTarget
            .setPointerCapture(
                event.pointerId
            );

        dragStartRef.current =
            {
                pointerX:
                    event.clientX,

                pointerY:
                    event.clientY,

                imageX:
                    position.x,

                imageY:
                    position.y,
            };
    }


    function handlePointerMove(
        event:
            PointerEvent<HTMLDivElement>
    ) {
        const dragStart =
            dragStartRef.current;

        if (
            !dragStart ||
            saving
        ) {
            return;
        }

        const nextPosition =
            {
                x:
                    dragStart.imageX +
                    (
                        event.clientX -
                        dragStart.pointerX
                    ),

                y:
                    dragStart.imageY +
                    (
                        event.clientY -
                        dragStart.pointerY
                    ),
            };

        setPosition(
            clampPosition(
                nextPosition
            )
        );
    }


    function handlePointerUp(
        event:
            PointerEvent<HTMLDivElement>
    ) {
        dragStartRef.current =
            null;

        if (
            event.currentTarget
                .hasPointerCapture(
                    event.pointerId
                )
        ) {
            event.currentTarget
                .releasePointerCapture(
                    event.pointerId
                );
        }
    }


    function closeEditor() {
        if (saving) {
            return;
        }

        setEditorOpen(
            false
        );

        setZoom(1);

        setPosition({
            x: 0,
            y: 0,
        });

        setLocalError(
            null
        );

        if (
            selectedImageUrl
        ) {
            URL.revokeObjectURL(
                selectedImageUrl
            );

            setSelectedImageUrl(
                null
            );
        }
    }


    async function handleSavePhoto() {
        const image =
            imageRef.current;

        const hiddenInput =
            uploadInputRef.current;

        const form =
            uploadFormRef.current;

        if (
            !image ||
            !hiddenInput ||
            !form ||
            !imageSize.width ||
            !imageSize.height
        ) {
            setLocalError(
                 t.errors.processingFailed
            );

            return;
        }

        setSaving(
            true
        );

        setLocalError(
            null
        );

        try {
            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                OUTPUT_SIZE;

            canvas.height =
                OUTPUT_SIZE;

            const context =
                canvas.getContext(
                    "2d"
                );

            if (!context) {
                throw new Error(
                    t.errors.preparingFailed
                );
            }

            const scale =
                getBaseScale() *
                zoom;

            const sourceSize =
                PREVIEW_SIZE /
                scale;

            const sourceX =
                (
                    imageSize.width -
                    sourceSize
                ) /
                    2 -
                position.x /
                    scale;

            const sourceY =
                (
                    imageSize.height -
                    sourceSize
                ) /
                    2 -
                position.y /
                    scale;

            context.imageSmoothingEnabled =
                true;

            context.imageSmoothingQuality =
                "high";

            context.drawImage(
                image,
                sourceX,
                sourceY,
                sourceSize,
                sourceSize,
                0,
                0,
                OUTPUT_SIZE,
                OUTPUT_SIZE
            );

            const blob =
                await new Promise<Blob | null>(
                    (resolve) => {
                        canvas.toBlob(
                            resolve,
                            "image/webp",
                            0.9
                        );
                    }
                );

            if (!blob) {
                throw new Error(
                    t.errors.generationFailed
                );
            }

            const safeName =
                selectedFileName
                    .replace(
                        /\.[^.]+$/,
                        ""
                    )
                    .replace(
                        /[^a-zA-Z0-9-_]/g,
                        "-"
                    );

            const croppedFile =
                new File(
                    [
                        blob,
                    ],
                    `${safeName || "avatar"}.webp`,
                    {
                        type:
                            "image/webp",
                    }
                );

            const transfer =
                new DataTransfer();

            transfer.items.add(
                croppedFile
            );

            hiddenInput.files =
                transfer.files;

            form.requestSubmit();
        } catch (error) {
            setSaving(
                false
            );

            setLocalError(
                error instanceof Error
                    ? error.message
                    : t.errors.saveFailed
            );
        }
    }


    const baseScale =
        getBaseScale();

    const finalScale =
        baseScale *
        zoom;


    return (
        <>
            <div className="profile-avatar-editor">
                <div className="profile-avatar-large">
                    {avatarUrl ? (
                        <img
                            src={
                                avatarUrl
                            }
                            alt={
                                `Foto de ${fullName}`
                            }
                        />
                    ) : (
                        <span>
                            {initials}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    className="secondary-button profile-change-photo-button"
                    onClick={
                        handleChoosePhoto
                    }
                >
                    {avatarUrl
                        ? t.changePhoto
                        : t.addPhoto}
                </button>

                <input
                    ref={
                        fileInputRef
                    }
                    className="profile-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                        handleFileChange
                    }
                    aria-label={
                        t.selectPhoto
                    }
                />

                <small className="profile-avatar-help">
                    {t.help}
                </small>

                {localError && (
                    <div
                        className="profile-avatar-local-error"
                        role="alert"
                    >
                        {localError}
                    </div>
                )}
            </div>

            <form
                ref={
                    uploadFormRef
                }
                action={
                    uploadAvatar
                }
                className="profile-hidden-upload-form"
            >
                <input
                    ref={
                        uploadInputRef
                    }
                    type="file"
                    name="avatar"
                    tabIndex={-1}
                    aria-hidden="true"
                />
            </form>

            {editorOpen &&
                selectedImageUrl && (
                    <div
                        className="avatar-editor-backdrop"
                        role="presentation"
                        onMouseDown={
                            (event) => {
                                if (
                                    event.target ===
                                    event.currentTarget
                                ) {
                                    closeEditor();
                                }
                            }
                        }
                    >
                        <section
                            className="avatar-editor-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="avatar-editor-title"
                        >
                            <div className="avatar-editor-header">
                                <div>
                                    <span className="avatar-editor-eyebrow">
                                        FOTO DE PERFIL
                                    </span>

                                    <h2
                                        id="avatar-editor-title"
                                    >
                                        Ajustar foto
                                    </h2>

                                    <p>
                                        Posicione a imagem
                                        dentro do círculo.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="avatar-editor-close"
                                    onClick={
                                        closeEditor
                                    }
                                    disabled={
                                        saving
                                    }
                                    aria-label="Fechar"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="avatar-editor-body">
                                <div className="avatar-editor-stage-wrapper">
                                    <div
                                        className={
                                            saving
                                                ? "avatar-editor-stage avatar-editor-stage--saving"
                                                : "avatar-editor-stage"
                                        }
                                        onPointerDown={
                                            handlePointerDown
                                        }
                                        onPointerMove={
                                            handlePointerMove
                                        }
                                        onPointerUp={
                                            handlePointerUp
                                        }
                                        onPointerCancel={
                                            handlePointerUp
                                        }
                                    >
                                        <img
                                            ref={
                                                imageRef
                                            }
                                            src={
                                                selectedImageUrl
                                            }
                                            alt="Pré-visualização da foto"
                                            draggable={
                                                false
                                            }
                                            onLoad={
                                                handleImageLoad
                                            }
                                            style={{
                                                transform:
                                                    `translate(-50%, -50%) ` +
                                                    `translate(${position.x}px, ${position.y}px) ` +
                                                    `scale(${finalScale})`,
                                            }}
                                        />

                                        <div
                                            className="avatar-editor-guide"
                                            aria-hidden="true"
                                        />

                                        <div
                                            className="avatar-editor-drag-hint"
                                            aria-hidden="true"
                                        >
                                            ↔
                                        </div>
                                    </div>
                                </div>

                                <p className="avatar-editor-instruction">
                                    Arraste a imagem para
                                    reposicionar seu rosto.
                                </p>

                                <div className="avatar-editor-zoom">
                                    <div className="avatar-editor-zoom-heading">
                                        <label htmlFor="avatarZoom">
                                            Zoom
                                        </label>

                                        <span>
                                            {Math.round(
                                                zoom *
                                                    100
                                            )}
                                            %
                                        </span>
                                    </div>

                                    <div className="avatar-editor-zoom-control">
                                        <span
                                            aria-hidden="true"
                                        >
                                            −
                                        </span>

                                        <input
                                            id="avatarZoom"
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.01"
                                            value={
                                                zoom
                                            }
                                            onChange={
                                                handleZoomChange
                                            }
                                            disabled={
                                                saving
                                            }
                                        />

                                        <span
                                            aria-hidden="true"
                                        >
                                            +
                                        </span>
                                    </div>
                                </div>

                                {localError && (
                                    <div
                                        className="profile-avatar-local-error"
                                        role="alert"
                                    >
                                        {localError}
                                    </div>
                                )}
                            </div>

                            <div className="avatar-editor-footer">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={
                                        closeEditor
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={
                                        handleSavePhoto
                                    }
                                    disabled={
                                        saving ||
                                        !imageSize.width
                                    }
                                >
                                    {saving
                                        ? "Salvando..."
                                        : "Salvar foto"}
                                </button>
                            </div>
                        </section>
                    </div>
                )}
        </>
    );
}
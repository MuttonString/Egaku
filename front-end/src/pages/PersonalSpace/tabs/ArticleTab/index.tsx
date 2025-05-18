import { Button, Flex, Input, Space, Upload } from 'antd';
import {
  AtomicBlockUtils,
  ContentBlock,
  convertFromRaw,
  convertToRaw,
  Editor,
  EditorState,
  Modifier,
  RawDraftContentState,
  RichUtils,
} from 'draft-js';
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.module.less';
import {
  BoldOutlined,
  FileImageOutlined,
  HighlightOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  RedoOutlined,
  SaveOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FontColorIcon from '../../../../components/FontColorIcon';
import FontSizeIcon from '../../../../components/FontSizeIcon';
import localforage from 'localforage';
import { useDebounceFn, useRequest } from 'ahooks';
import { uploadFile } from '../../../../services/common';
import ErrorNotification, {
  IErrorNotification,
} from '../../../../components/ErrorNotification';
import { submit } from '../../../../services/article';
import SuccessMessage, {
  ISuccessMessage,
} from '../../../../components/SuccessMessage';

const customStyleMap = {
  HIGHLIGHT: {
    backgroundColor: '#ffff007f',
  },
  RED: {
    color: 'red',
  },
  BLUE: {
    color: 'royalblue',
  },
  '1.5X': {
    fontSize: '1.5em',
  },
  '2X': {
    fontSize: '2em',
  },
  '3X': {
    fontSize: '3em',
  },
};

const COLORS = ['RED', 'BLUE'];
const SIZE = ['1.5X', '2X', '3X', '4X'];

export default function ArticleTab() {
  const { t } = useTranslation();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [title, setTitle] = useState('');
  const [cnt, setCnt] = useState(0);
  const [tip, setTip] = useState('');
  const errorRef = useRef<IErrorNotification>(null);
  const successRef = useRef<ISuccessMessage>(null);

  const hideTip = useDebounceFn(() => setTip(''), { wait: 3000 }).run;
  const setTipTemp = useCallback(
    (tip: string) => {
      setTip(tip);
      hideTip();
    },
    [hideTip]
  );

  const tips = useMemo(
    () => ({
      saved: t('personal.article.saved'),
      saveFail: t('personal.article.saveFail'),
      uploading: t('personal.article.uploading'),
      uploadSuccess: t('personal.article.uploadSuccess'),
      uploadFail: t('personal.article.uploadFail'),
      tooLarge: t('personal.article.tooLarge'),
    }),
    [t]
  );

  const saveToLocal = useCallback(async () => {
    try {
      if (title) await localforage.setItem('articleTitle', title);
      if (cnt)
        await localforage.setItem(
          'articleContent',
          convertToRaw(editorState.getCurrentContent())
        );
      if (title || cnt) setTipTemp(tips.saved);
    } catch {
      setTipTemp(tips.saveFail);
    }
  }, [title, cnt, editorState, setTipTemp, tips.saved, tips.saveFail]);
  const saveRef = useRef(saveToLocal);
  useEffect(() => {
    saveRef.current = saveToLocal;
  }, [saveToLocal]);

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const selection = editorState.getSelection();
        const contentState = editorState.getCurrentContent();
        const newContentState = Modifier.replaceText(
          contentState,
          selection,
          '\t'
        );
        setEditorState(
          EditorState.push(editorState, newContentState, 'insert-characters')
        );
      }
    },
    [editorState]
  );

  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };

    const interval = setInterval(() => {
      saveRef.current();
    }, 60 * 1000);
    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localforage.getItem('articleTitle').then((val) => {
      if (val) setTitle(val as string);
    });
    localforage.getItem('articleContent').then((val) => {
      if (val) {
        const state = EditorState.createWithContent(
          convertFromRaw(val as RawDraftContentState)
        );
        setEditorState(state);
        setCnt(state.getCurrentContent().getPlainText().length);
      }
    });
  }, []);

  const inlineBtnType = (inlineStyleKey: string) =>
    editorState.getCurrentInlineStyle().has(inlineStyleKey)
      ? 'primary'
      : 'default';

  const inlineStyleBtnClick = (inlineStyleKey: string) =>
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyleKey));

  const blockBtnType = (inlineStyleKey: string) =>
    editorState
      .getCurrentContent()
      .getBlockForKey(editorState.getSelection().getStartKey())
      .getType() === inlineStyleKey
      ? 'primary'
      : 'default';

  const blockTypeBtnClick = (inlineStyleKey: string) =>
    setEditorState(RichUtils.toggleBlockType(editorState, inlineStyleKey));

  const onMouseDown: MouseEventHandler<HTMLElement> = (e) => e.preventDefault();

  const toggleColor = (colorStyleKey: string) => {
    let newState = editorState;
    const currStyle = editorState.getCurrentInlineStyle();
    COLORS.forEach((color) => {
      if (currStyle.has(color))
        newState = RichUtils.toggleInlineStyle(newState, color);
    });
    if (!currStyle.has(colorStyleKey))
      newState = RichUtils.toggleInlineStyle(newState, colorStyleKey);
    setEditorState(newState);
  };

  const toggleSize = (sizeStyleKey: string) => {
    let newState = editorState;
    const currStyle = editorState.getCurrentInlineStyle();
    SIZE.forEach((size) => {
      if (currStyle.has(size))
        newState = RichUtils.toggleInlineStyle(newState, size);
    });
    if (!currStyle.has(sizeStyleKey))
      newState = RichUtils.toggleInlineStyle(newState, sizeStyleKey);
    setEditorState(newState);
  };

  type BlockProps = { blockProps: { src: string } };
  const imageRender = useCallback(({ blockProps }: BlockProps) => {
    return (
      <div>
        <img src={blockProps.src} alt="" style={{ maxHeight: '20em' }} />
      </div>
    );
  }, []);

  const blockRendererFn = useCallback(
    (contentBlock: ContentBlock) => {
      if (contentBlock.getType() === 'atomic') {
        const contentState = editorState.getCurrentContent();
        const entityKey = contentBlock.getEntityAt(0);

        if (entityKey) {
          const entity = contentState.getEntity(entityKey);
          const type = entity.getType();

          if (type === 'IMAGE') {
            return {
              component: imageRender,
              editable: false,
              props: { src: entity.getData().src },
            };
          }
        }
      }
      return null;
    },
    [editorState, imageRender]
  );

  const insertImage = useCallback(
    (imageUrl: string) => {
      const contentState = editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity(
        'IMAGE',
        'IMMUTABLE',
        { src: imageUrl }
      );
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
      const newEditorState = AtomicBlockUtils.insertAtomicBlock(
        editorState,
        entityKey,
        ' '
      );
      setEditorState(newEditorState);
    },
    [editorState]
  );

  const { run: uploadRun } = useRequest(uploadFile, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        setTipTemp(tips.uploadSuccess);
        insertImage(data.data.url!);
      } else {
        setTipTemp(tips.uploadFail);
      }
    },
    onError() {
      setTipTemp(tips.uploadFail);
    },
  });

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const imageItem = Array.from(items).find((item) =>
        item.type.startsWith('image/')
      );
      if (!imageItem) return;
      setTipTemp(tips.uploading);
      const file = imageItem.getAsFile();
      if (file) {
        uploadRun(file);
      }
    },
    [setTipTemp, tips.uploading, uploadRun]
  );

  const { run: submitRun, loading: submitLoading } = useRequest(submit, {
    manual: true,
    onSuccess(data) {
      if (data.success) {
        setTitle('');
        setEditorState(EditorState.createEmpty());
        localforage.removeItem('articleTitle');
        localforage.removeItem('articleContent');
        successRef.current!.open(t('personal.article.submit'));
      } else {
        errorRef.current!.open(data.data.error);
      }
    },
    onError(err) {
      errorRef.current!.open(err);
    },
  });

  return (
    <Flex gap={16} vertical className={styles.container}>
      <SuccessMessage ref={successRef} />
      <ErrorNotification ref={errorRef} />
      <Space.Compact>
        <Input
          maxLength={50}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('personal.article.title')}
          showCount
        />
        <Button
          type="primary"
          disabled={!title || !cnt || cnt > 5000}
          loading={submitLoading}
          onClick={() => {
            submitRun({
              title,
              content: JSON.stringify(
                convertToRaw(editorState.getCurrentContent())
              ),
            });
          }}
        >
          {t('personal.article.submit')}
        </Button>
      </Space.Compact>

      <div>
        <Flex gap={4} className={styles.control}>
          <Space.Compact>
            <Button
              size="small"
              type={inlineBtnType('BOLD')}
              onClick={() => inlineStyleBtnClick('BOLD')}
              onMouseDown={onMouseDown}
            >
              <BoldOutlined />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('ITALIC')}
              onClick={() => inlineStyleBtnClick('ITALIC')}
              onMouseDown={onMouseDown}
            >
              <ItalicOutlined />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('UNDERLINE')}
              onClick={() => inlineStyleBtnClick('UNDERLINE')}
              onMouseDown={onMouseDown}
            >
              <UnderlineOutlined />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('STRIKETHROUGH')}
              onClick={() => inlineStyleBtnClick('STRIKETHROUGH')}
              onMouseDown={onMouseDown}
            >
              <StrikethroughOutlined />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('HIGHLIGHT')}
              onClick={() => inlineStyleBtnClick('HIGHLIGHT')}
              onMouseDown={onMouseDown}
            >
              <HighlightOutlined />
            </Button>
          </Space.Compact>
          <Space.Compact>
            <Button
              size="small"
              type={inlineBtnType('RED')}
              onClick={() => toggleColor('RED')}
              onMouseDown={onMouseDown}
            >
              <FontColorIcon fontColor="red" />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('BLUE')}
              onClick={() => toggleColor('BLUE')}
              onMouseDown={onMouseDown}
            >
              <FontColorIcon fontColor="royalblue" />
            </Button>
          </Space.Compact>
          <Space.Compact>
            <Button
              size="small"
              type={inlineBtnType('1.5X')}
              onClick={() => toggleSize('1.5X')}
              onMouseDown={onMouseDown}
            >
              <FontSizeIcon fontSize={1.5} />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('2X')}
              onClick={() => toggleSize('2X')}
              onMouseDown={onMouseDown}
            >
              <FontSizeIcon fontSize={2} />
            </Button>
            <Button
              size="small"
              type={inlineBtnType('3X')}
              onClick={() => toggleSize('3X')}
              onMouseDown={onMouseDown}
            >
              <FontSizeIcon fontSize={3} />
            </Button>
          </Space.Compact>
          <Space.Compact>
            <Button
              size="small"
              type={blockBtnType('unordered-list-item')}
              onClick={() => blockTypeBtnClick('unordered-list-item')}
              onMouseDown={onMouseDown}
            >
              <UnorderedListOutlined />
            </Button>
            <Button
              size="small"
              type={blockBtnType('ordered-list-item')}
              onClick={() => blockTypeBtnClick('ordered-list-item')}
              onMouseDown={onMouseDown}
            >
              <OrderedListOutlined />
            </Button>
          </Space.Compact>
          <Space.Compact>
            <Button
              size="small"
              disabled={editorState.getUndoStack().size <= 0}
              onClick={() => setEditorState(EditorState.undo(editorState))}
              onMouseDown={onMouseDown}
            >
              <UndoOutlined />
            </Button>
            <Button
              size="small"
              disabled={editorState.getRedoStack().size <= 0}
              onClick={() => setEditorState(EditorState.redo(editorState))}
              onMouseDown={onMouseDown}
            >
              <RedoOutlined />
            </Button>
            <Button
              size="small"
              onClick={saveToLocal}
              onMouseDown={onMouseDown}
            >
              <SaveOutlined />
            </Button>
          </Space.Compact>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => {
              if (!file.type.startsWith('image')) return false;
              if (file.size > 10 * 1024 * 1024) {
                setTipTemp(tips.tooLarge);
                return false;
              }
              setTipTemp(tips.uploading);
              uploadRun(file);
              return false;
            }}
          >
            <Button size="small" onClick={() => {}} onMouseDown={onMouseDown}>
              <FileImageOutlined />
              {t('personal.article.upload')}
            </Button>
          </Upload>
        </Flex>
        <div
          className={styles.editor}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        >
          <Editor
            editorState={editorState}
            customStyleMap={customStyleMap}
            onChange={(state) => {
              setEditorState(state);
              setCnt(state.getCurrentContent().getPlainText().length);
            }}
            handleKeyCommand={(command) => {
              const newState = RichUtils.handleKeyCommand(editorState, command);
              if (newState) {
                setEditorState(newState);
                return 'handled';
              }
              return 'not-handled';
            }}
            blockRendererFn={blockRendererFn}
          />
        </div>
        <div className={styles.gray}>
          <div
            className={styles.tip}
            style={{
              color: [tips.saveFail, tips.tooLarge, tips.uploadFail].includes(
                tip
              )
                ? 'red'
                : '',
            }}
          >
            {tip}
          </div>
          <div
            className={styles.cnt}
            style={{ color: cnt > 5000 ? 'red' : '' }}
          >
            {cnt} / 5000
          </div>
        </div>
      </div>

      <Flex gap={8} className={styles.gray}>
        <WarningOutlined />
        {t('personal.article.warn')}
      </Flex>
    </Flex>
  );
}

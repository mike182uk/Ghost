import React, {useEffect, useRef, useState} from 'react';

import NiceModal, {useModal} from '@ebay/nice-modal-react';
import {Button, Modal} from '@tryghost/admin-x-design-system';
import {ObjectProperties} from '@tryghost/admin-x-framework/api/activitypub';
import {useBrowseSite} from '@tryghost/admin-x-framework/api/site';

import FeedItem from './FeedItem';

import APReplyBox from '../global/APReplyBox';
import articleBodyStyles from '../articleBodyStyles';
import {type Activity} from '../activities/ActivityItem';

const getContentAuthor = (activity: Activity) => {
    const actor = activity.actor;
    const attributedTo = activity.object.attributedTo;

    if (!attributedTo) {
        return actor;
    }

    if (typeof attributedTo === 'string') {
        return actor;
    }

    if (Array.isArray(attributedTo)) {
        const found = attributedTo.find(item => typeof item !== 'string');
        if (found) {
            return found;
        } else {
            return actor;
        }
    }

    return attributedTo;
};

const ArticleBody: React.FC<{heading: string, image: string|undefined, html: string}> = ({heading, image, html}) => {
    const site = useBrowseSite();
    const siteData = site.data?.site;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const cssContent = articleBodyStyles(siteData?.url.replace(/\/$/, ''));
    const htmlContent = `
  <html>
  <head>
    ${cssContent}
  </head>
  <body>
    <header class='gh-article-header gh-canvas'>
        <h1 class='gh-article-title is-title' data-test-article-heading>${heading}</h1>
${image &&
        `<figure class='gh-article-image'>
            <img src='${image}' alt='${heading}' />
        </figure>`
}
    </header>
    <div class='gh-content gh-canvas is-body'>
      ${html}
    </div>
  </body>
  </html>
`;

    useEffect(() => {
        const iframe = iframeRef.current;
        if (iframe) {
            iframe.srcdoc = htmlContent;
        }
    }, [htmlContent]);

    return (
        <div>
            <iframe
                ref={iframeRef}
                className={`h-[calc(100vh_-_3vmin_-_4.8rem_-_2px)]`}
                height='100%'
                id='gh-ap-article-iframe'
                title='Embedded Content'
                width='100%'
            >
            </iframe>
        </div>
    );
};

const FeedItemDivider: React.FC = () => (
    <div className="h-px bg-grey-200"></div>
);

interface ArticleModalProps {
    activity: Activity;
    focusReply: boolean;
    addReplyToActivity: (id: string, reply: Activity) => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({activity: initalActivity, focusReply, addReplyToActivity}) => {
    const MODAL_SIZE_SM = 640;
    const MODAL_SIZE_LG = 2800;
    const [isFocused, setFocused] = useState(focusReply ? 1 : 0);
    function setReplyBoxFocused(focused: boolean) {
        if (focused) {
            setFocused(prev => prev + 1);
        } else {
            setFocused(0);
        }
    }
    const [modalSize, setModalSize] = useState<number>(MODAL_SIZE_SM);
    const modal = useModal();

    const [rootActivity, setRootActivity] = useState(initalActivity);
    const [activity, setActivity] = useState(initalActivity);
    const [actor, setActor] = useState(getContentAuthor(initalActivity));
    const [object, setObject] = useState(initalActivity.object);

    useEffect(() => {
        setActor(getContentAuthor(activity));
        setObject(activity.object);
    }, [activity]);

    const [canNavigateBack, setCanNavigateBack] = useState(false);
    const navigateBack = () => {
        const findParentActivity = (parentActivity: Activity, childActivity: Activity): Activity | null => {
            if (parentActivity.object.id === childActivity.object.inReplyTo) {
                return parentActivity;
            }

            for (const reply of parentActivity.object.replies) {
                const foundParent = findParentActivity(reply, childActivity);

                if (foundParent) {
                    return foundParent;
                }
            }

            return null;
        };

        const parentActivity = findParentActivity(rootActivity, activity) || rootActivity;

        setActivity(parentActivity);
        setCanNavigateBack(parentActivity.id !== rootActivity.id);
    };
    const navigateForward = (nextActivity: Activity) => {
        setActivity(nextActivity);
        setCanNavigateBack(true);
    };

    const toggleModalSize = () => {
        setModalSize(modalSize === MODAL_SIZE_SM ? MODAL_SIZE_LG : MODAL_SIZE_SM);
    };

    function handleNewReply(newReply: Activity) {
        addReplyToActivity(activity.object.id, newReply);

        const addReplyToLocalActivity = (rootObject: ObjectProperties, reply: Activity) => {
            if (rootObject.id === reply.object.inReplyTo) {
                rootObject.replies.push(reply);
                return true;
            }

            for (const comment of rootObject.replies) {
                if (addReplyToLocalActivity(comment.object, reply)) {
                    return true;
                }
            }

            return false;
        };

        const newRootObject = {...rootActivity.object};

        addReplyToLocalActivity(newRootObject, newReply);
        setRootActivity({...rootActivity, object: newRootObject});
    }

    return (
        <Modal
            align='right'
            animate={true}
            footer={<></>}
            height={'full'}
            padding={false}
            size='bleed'
            width={modalSize}
        >
            <div className='sticky top-0 z-50 border-grey-200 bg-white py-3'>
                <div className='grid h-8 grid-cols-3'>
                    {canNavigateBack && (
                        <div className='col-[1/2] flex items-center justify-between px-8'>
                            <Button icon='chevron-left' size='sm' unstyled onClick={navigateBack}/>
                        </div>
                    )}
                    <div className='col-[2/3] flex grow items-center justify-center px-8 text-center'>
                        {/* <span className='text-lg font-semibold text-grey-900'>{object.type}</span> */}
                    </div>
                    <div className='col-[3/4] flex items-center justify-end space-x-6 px-8'>
                        <Button icon='angle-brackets' size='md' unstyled onClick={toggleModalSize}/>
                        <Button icon='close' size='sm' unstyled onClick={() => modal.remove()}/>
                    </div>
                </div>
            </div>
            <div className='mt-10 w-auto'>
                {object.type === 'Note' && (
                    <div className='mx-auto max-w-[580px] pb-16'>
                        <FeedItem
                            actor={actor}
                            comments={object.replies}
                            layout='modal'
                            object={object}
                            type='Note'
                            onCommentClick={() => {
                                setReplyBoxFocused(true);
                            }}
                        />
                        <APReplyBox focused={isFocused} object={object} onNewReply={handleNewReply}/>
                        <FeedItemDivider />

                        {object.replies.map((comment, index) => {
                            const showDivider = index !== object.replies.length - 1;
                            const nestedComments = comment.object.replies ?? [];
                            const hasNestedComments = nestedComments.length > 0;

                            return (
                                <>
                                    <FeedItem
                                        actor={comment.actor}
                                        comments={nestedComments}
                                        last={true}
                                        layout='reply'
                                        object={comment.object}
                                        type='Note'
                                        onClick={() => {
                                            navigateForward(comment);
                                        }}
                                        onCommentClick={() => {}}
                                    />
                                    {hasNestedComments && <FeedItemDivider />}
                                    {nestedComments.map((nestedComment, nestedCommentIndex) => {
                                        const nestedNestedComments = nestedComment.object.replies ?? [];

                                        return (
                                            <FeedItem
                                                actor={nestedComment.actor}
                                                comments={nestedNestedComments}
                                                last={nestedComments.length === nestedCommentIndex + 1}
                                                layout='reply'
                                                object={nestedComment.object}
                                                type='Note'
                                                onClick={() => {
                                                    navigateForward(nestedComment);
                                                }}
                                                onCommentClick={() => {}}
                                            />
                                        );
                                    })}
                                    {showDivider && <FeedItemDivider />}
                                </>
                            );
                        })}
                    </div>
                )}
                {object.type === 'Article' && (
                    <ArticleBody heading={object.name} html={object.content} image={object?.image} />
                )}
            </div>
        </Modal>
    );
};

export default NiceModal.create(ArticleModal);

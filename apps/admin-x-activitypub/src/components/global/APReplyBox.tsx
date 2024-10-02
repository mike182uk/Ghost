import React, {HTMLProps, useEffect, useId, useRef, useState} from 'react';

import * as FormPrimitive from '@radix-ui/react-form';
import APAvatar from './APAvatar';
import clsx from 'clsx';
import getUsername from '../../utils/get-username';
import {Activity} from '../activities/ActivityItem';
import {ActorProperties, ObjectProperties} from '@tryghost/admin-x-framework/api/activitypub';
import {Button, showToast} from '@tryghost/admin-x-design-system';
import {useReplyMutationForUser, useUserDataForUser} from '../../hooks/useActivityPubQueries';
// import {useFocusContext} from '@tryghost/admin-x-design-system/types/providers/DesignSystemProvider';

export interface APTextAreaProps extends HTMLProps<HTMLTextAreaElement> {
    title?: string;
    value?: string;
    rows?: number;
    error?: boolean;
    placeholder?: string;
    hint?: React.ReactNode;
    className?: string;
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onNewReply?: (activity: Activity) => void;
    object: ObjectProperties;
    focused: number;
}

const APReplyBox: React.FC<APTextAreaProps> = ({
    title,
    value,
    rows = 1,
    maxLength,
    error,
    hint,
    className,
    object,
    focused,
    onNewReply,
    // onChange,
    // onFocus,
    // onBlur,
    ...props
}) => {
    const id = useId();
    const [textValue, setTextValue] = useState(value); // Manage the textarea value with state
    const replyMutation = useReplyMutationForUser('index');

    const {data: user} = useUserDataForUser('index');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current && focused) {
            textareaRef.current.focus();
        }
    }, [focused]);

    async function handleClick() {
        if (!textValue) {
            return;
        }

        const fakeReply = {
            cc: 'https://foo.bar/users/foobarbaz/followers',
            id: `https://foo.bar/${Date.now()}/activity`,
            to: 'as:Public',
            type: 'Create',
            actor: {
                id: 'https://foo.bar/users/foobarbaz',
                url: 'https://foo.bar/users/foobarbaz',
                name: 'Foo Bar Baz',
                type: 'Person',
                inbox: 'https://foo.bar/users/foobarbaz/inbox',
                outbox: 'https://foo.bar/users/foobarbaz/outbox',
                summary: '',
                endpoints: {
                    type: 'as:Endpoints',
                    sharedInbox: 'https:/foo.bar/inbox'
                },
                followers: 'https://foo.bar/users/foobarbaz/followers',
                following: 'https://foo.bar/users/foobarbaz/following',
                published: new Date().toISOString(),
                'toot:featured': {
                    id: 'https://foo.bar/users/foobarbaz/collections/featured'
                },
                preferredUsername: 'foobarbaz',
                'toot:discoverable': false,
                'toot:featuredTags': {
                    id: 'https://foo.bar/users/foobarbaz/collections/tags'
                },
                'as:manuallyApprovesFollowers': false,
                'https://w3id.org/security#publicKey': {
                    id: 'https://foo.bar/users/foobarbaz#main-key',
                    type: 'https://w3id.org/security#Key',
                    'https://w3id.org/security#owner': {
                        id: 'https://foo.bar/users/foobarbaz'
                    },
                    'https://w3id.org/security#publicKeyPem': 'abc123'
                }
            },
            object: {
                cc: 'https://foo.bar/users/foobarbaz/followers',
                id: `https://foo.bar/${Date.now()}`,
                to: 'as:Public',
                url: `https://foo.bar/${Date.now()}`,
                type: 'Note',
                content: textValue,
                replies: [],
                inReplyTo: object.id,
                published: new Date().toISOString(),
                sensitive: false,
                contentMap: {
                    en: textValue
                },
                attributedTo: {
                    id: 'https://foo.bar/users/foobarbaz',
                    url: 'https://foo.bar/users/foobarbaz',
                    name: 'Foo Bar Baz',
                    type: 'Person',
                    inbox: 'https://foo.bar/users/foobarbaz/inbox',
                    outbox: 'https://foo.bar/users/foobarbaz/outbox',
                    summary: '',
                    '@context': [
                        'https://www.w3.org/ns/activitystreams',
                        'https://w3id.org/security/v1',
                        'https://w3id.org/security/data-integrity/v1',
                        'https://www.w3.org/ns/did/v1',
                        'https://w3id.org/security/multikey/v1',
                        {
                            toot: 'http://joinmastodon.org/ns#',
                            value: 'schema:value',
                            schema: 'http://schema.org#',
                            featured: {
                                '@id': 'toot:featured',
                                '@type': '@id'
                            },
                            memorial: 'toot:memorial',
                            indexable: 'toot:indexable',
                            suspended: 'toot:suspended',
                            discoverable: 'toot:discoverable',
                            featuredTags: {
                                '@id': 'toot:featuredTags',
                                '@type': '@id'
                            },
                            PropertyValue: 'schema:PropertyValue',
                            manuallyApprovesFollowers: 'as:manuallyApprovesFollowers'
                        }
                    ],
                    featured: 'https://foo.bar/users/foobarbaz/collections/featured',
                    endpoints: {
                        type: 'as:Endpoints',
                        sharedInbox: 'https:/foo.bar/inbox'
                    },
                    followers: 'https://foo.bar/users/foobarbaz/followers',
                    following: 'https://foo.bar/users/foobarbaz/following',
                    publicKey: {
                        id: 'https://foo.bar/users/foobarbaz#main-key',
                        type: 'CryptographicKey',
                        owner: 'https://foo.bar/users/foobarbaz',
                        publicKeyPem: 'abc123'
                    },
                    published: new Date().toISOString(),
                    discoverable: false,
                    featuredTags: 'https://foo.bar/users/foobarbaz/collections/tags',
                    preferredUsername: 'foobarbaz',
                    manuallyApprovesFollowers: false
                }
            },
            '@context': [
                'https://www.w3.org/ns/activitystreams',
                'https://w3id.org/security/data-integrity/v1',
                {
                    toot: 'http://joinmastodon.org/ns#',
                    Emoji: 'toot:Emoji',
                    Hashtag: 'as:Hashtag',
                    sensitive: 'as:sensitive',
                    ChatMessage: 'http://litepub.social/ns#ChatMessage',
                    votersCount: 'toot:votersCount'
                }
            ],
            published: new Date().toISOString()
        };

        setTextValue('');
        showToast({
            message: 'Reply sent',
            type: 'success'
        });
        if (onNewReply) {
            onNewReply(fakeReply as unknown as Activity);
        }

        // await replyMutation.mutate({id: object.id, content: textValue}, {
        //     onSuccess(activity: Activity) {
        //         setTextValue('');
        //         showToast({
        //             message: 'Reply sent',
        //             type: 'success'
        //         });
        //         if (onNewReply) {
        //             onNewReply(activity);
        //         }
        //     }
        // });
    }

    function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        setTextValue(event.target.value); // Update the state on every change
    }

    const [isFocused, setFocused] = useState(false);

    function handleBlur() {
        setFocused(false);
    }

    function handleFocus() {
        setFocused(true);
    }

    const styles = clsx(
        `ap-textarea order-2 w-full resize-none rounded-lg border py-2 pr-3 text-[1.5rem] transition-all dark:text-white ${isFocused && 'pb-12'}`,
        error ? 'border-red' : 'border-transparent placeholder:text-grey-500 dark:placeholder:text-grey-800',
        title && 'mt-1.5',
        className
    );

    // We disable the button if either the textbox isn't focused, or the reply is currently being sent.
    const buttonDisabled = !isFocused || replyMutation.isLoading;

    let placeholder = 'Reply...';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attributedTo = (object.attributedTo || {}) as any;
    if (typeof attributedTo.preferredUsername === 'string' && typeof attributedTo.id === 'string') {
        placeholder = `Reply to ${getUsername(attributedTo)}...`;
    }

    return (
        <div className='flex w-full gap-x-3 py-6'>
            <APAvatar author={user as ActorProperties} />
            <div className='relative w-full'>
                <FormPrimitive.Root asChild>
                    <div className='flex w-full flex-col'>
                        <FormPrimitive.Field name={id} asChild>
                            <FormPrimitive.Control asChild>
                                <textarea
                                    ref={textareaRef}
                                    className={styles}
                                    disabled={replyMutation.isLoading}
                                    id={id}
                                    maxLength={maxLength}
                                    placeholder={placeholder}
                                    rows={isFocused ? 3 : rows}
                                    value={textValue}
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    onFocus={handleFocus}
                                    {...props}>
                                </textarea>
                            </FormPrimitive.Control>
                        </FormPrimitive.Field>
                        {title}
                        {hint}
                    </div>
                </FormPrimitive.Root>
                <div className='absolute bottom-[6px] right-[9px] flex space-x-4 transition-[opacity] duration-150'>
                    <Button color='black' disabled={buttonDisabled} id='post' label='Post' loading={replyMutation.isLoading} size='sm' onMouseDown={handleClick} />
                </div>
            </div>
        </div>
    );
};

export default APReplyBox;

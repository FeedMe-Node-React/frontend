import React from 'react';
import dotenv from 'dotenv';

import Button from '../../Button/Button';
import Image from '../../Image/Image';
import './Post.css';

dotenv.config();

const post = props => (
  <article className="post">
    <header className="post__header">
      <h3 className="post__meta">
        Posted by {props.user.name} on {props.date}
      </h3>
      <h1 className="post__title">{props.title}</h1>
    </header>
    <div className="post__image">
      <Image image={'https://feed-me-node-api.herokuapp.com/' + props.image} contain />
    </div>
    <div className="post__content">{props.content}</div>
    <div className="post__actions">
      <Button mode="flat" link={props.id}>
        View
      </Button>
      <Button mode="flat" onClick={props.onStartEdit}>
        Edit
      </Button>
      <Button mode="flat" design="danger" onClick={props.onDelete}>
        Delete
      </Button>
    </div>
  </article>
);

export default post;

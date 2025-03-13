import React from 'react';

const Type = () => (
    <React.Fragment>
        <h1>Heading 1</h1>
        <p>
            This is a generic paragraph. Fusce dapibus, this is a <a href="#">Link</a>, This is{' '}
            <em>emphasised text</em>, this is <strong>strongly emphasised text</strong>. Nullam id
            dolor id nibh ultricies vehicula ut id elit. Aenean lacinia bibendum nulla sed
            consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec
            id elit non mi porta gravida at eget metus.
        </p>

        <p>
            Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Lorem ipsum dolor
            sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Maecenas faucibus mollis interdum. Curabitur blandit tempus porttitor.
        </p>

        <ul>
            <li>
                <abbr title="Cascading Style Sheets">CSS</abbr> (an abbreviation; <code>abbr</code>{' '}
                markup used)
            </li>
            <li>
                <b>bolded</b> (<code>b</code> markup used - just bolding with unspecified semantics)
            </li>
            <li>
                <cite>Origin of Species</cite> (a book title; <code>cite</code> markup used)
            </li>
            <li>
                <code>a[i] = b[i] + c[i);</code> (computer code; <code>code</code> markup used)
            </li>
            <li>
                here we have some <del>deleted</del> text (<code>del</code> markup used)
            </li>
            <li>
                an <dfn>octet</dfn> is an entity consisting of eight bits (<code>dfn</code> markup
                used for the term being defined)
            </li>
            <li>
                {' '}
                this is <em>very</em> simple (<code>em</code> markup used for emphasizing a word)
            </li>
            <li>
                <i lang="la">Homo sapiens</i> (should appear in italics; <code>i</code> markup used)
            </li>
            <li>
                {' '}
                here we have some <ins>inserted</ins> text (<code>ins</code> markup used)
            </li>
            <li>
                {' '}
                type <kbd>yes</kbd> when prompted for an answer (<code>kbd</code> markup used for
                text indicating keyboard input)
            </li>
            <li>
                <q>Hello!</q> (<code>q</code> markup used for quotation)
            </li>
            <li>
                He said:{' '}
                <q>
                    She said <q>Hello!</q>
                </q>{' '}
                (a quotation inside a quotation)
            </li>
            <li>
                {' '}
                you may get the message <samp>Core dumped</samp> at times (<code>samp</code> markup
                used for sample output)
            </li>
            <li>
                <small>this is not that important</small>(<code>small</code> markup used)
            </li>
            <li>
                <strong>this is highlighted text</strong> (<code>strong</code> markup used)
            </li>
            <li>
                In order to test how subscripts and superscripts (<code>sub</code> and
                <code>sup</code> markup) work inside running text, we need some dummy text around
                constructs like x<sub>1</sub> and H<sub>2</sub>O (where subscripts occur). So here
                is some fill so that you will (hopefully) see whether and how badly the subscripts
                and superscripts mess up vertical spacing between lines. Now superscripts: M
                <sup>lle</sup>, 1<sup>st</sup>, and then some mathematical notations: e<sup>x</sup>,
                sin<sup>2</sup> <i>x</i>, and some nested superscripts (exponents) too: e
                <sup>
                    x<sup>2</sup>
                </sup>{' '}
                and f(x)
                <sup>
                    g(x)<sup>a+b+c</sup>
                </sup>
                (where 2 and a+b+c should appear as exponents of exponents).
            </li>
            <li>
                <u>underlined</u> text (<code>u</code> markup used)
            </li>
            <li>
                the command <code>cat</code> <var>filename</var> displays the file specified by the{' '}
                <var>filename</var> (<code>var</code> markup used to indicate a word as a variable).
            </li>
        </ul>

        <h2>Some content</h2>
        <p>
            Nullam id dolor id nibh ultricies vehicula ut id elit. Cras justo odio, dapibus ac
            facilisis in, egestas eget quam. Maecenas sed diam eget risus varius blandit sit amet
            non magna. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis
            vestibulum. Curabitur blandit tempus porttitor. Donec id elit non mi porta gravida at
            eget metus. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget
            lacinia odio sem nec elit.
        </p>

        <h2>Vulputate Amet Justo</h2>
        <p>
            Maecenas faucibus mollis interdum. Cras justo odio, dapibus ac facilisis in, egestas
            eget quam.
        </p>

        <h3>Vivamus sagittis lacus vel.</h3>
        <p>
            Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Donec sed
            odio dui. Maecenas sed diam eget risus varius blandit sit amet non magna. Maecenas
            faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris
            condimentum nibh, ut fermentum massa justo sit amet risus. Curabitur blandit tempus
            porttitor. Cras mattis consectetur purus sit amet fermentum.
        </p>
        <h4>Condimentum nibh</h4>
        <p>
            Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor
            mauris condimentum nibh, ut fermentum massa justo sit amet risus. Curabitur blandit
            tempus porttitor. Cras mattis consectetur purus
        </p>
        <h5>Duis mollis</h5>
        <p>
            Pellentesque ornare sem lacinia quam venenatis vestibulum. Curabitur blandit tempus
            porttitor. Donec id elit non mi porta gravida at eget metus. Duis mollis
        </p>
        <hr />
        <p>Here is a blockquote:</p>
        <blockquote>
            <p>
                Pellentesque ornare sem lacinia quam venenatis vestibulum. Donec sed odio dui.
                Maecenas sed diam eget risus varius blandit sit amet non magna.
            </p>

            <cite>Mr Chrome</cite>
        </blockquote>
    </React.Fragment>
);

export default Type;

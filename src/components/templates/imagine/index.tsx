"use client"

import { useEffect, useState } from "react"
import "./imagine.css"
import type { TemplateProps } from "@/types/template"
import Wishes from "./Wishes"
import InvitationOverlay from "@/components/InvitationOverlay"

const RAW_HTML = ` </body>

        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P7SMP7M"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->

        <!-- Side to Side -->
        <section class="kat-page__side-to-side">

            <!-- Primary Pane -->
            <section class="primary-pane">
                <div class="inner">

                    <div class="ornaments-wrapper">
                        <!-- TOP LEFT -->
                        <div class="orn-primary--top-left">
                            <!-- LAMP 1 -->
                            <div class="orn-primary--top-left--lamp-1">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="3200" data-aos-delay="3300">
                                    <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                </div>
                            </div>

                            <!-- LAMP 2 -->
                            <div class="orn-primary--top-left--lamp-2">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="3100">
                                    <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                </div>
                            </div>
                            
                            <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2300">
                                <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                            </div>
                            
                            <!-- FLOWER 1 -->
                            <div class="orn-primary--top-left--flower-1">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2700">
                                    <img src="/templates/imagine/orn-19-min.png" alt="Ornament">
                                </div>
                            </div>
                        </div>

                        <!-- TOP RIGHT -->
                        <div class="orn-primary--top-right">
                            <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2450">
                                <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                            </div>
                            <!-- ORN BIRD -->
                            <div class="orn-primary--bird">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2450">
                                    <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- GARDEN -->
                    <div class="primary-pane-garden">
                        <!-- GATE -->
                        <div class="primary-pane-gate">
                            <div class="image-wrap" data-aos="zoom-out" data-aos-duration="2500" data-aos-delay="800">
                                <img src="/templates/imagine/orn-10-min.png" alt="Ornament">
                            </div>
                            <div class="ornaments-wrapper">
                                
                                
                                <!-- BOTTOM CENTER -->
                                <div class="orn-footnote--bottom-center">
                                    <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3200" data-aos-delay="2200">
                                        <img src="/templates/imagine/orn-13-min.png" alt="Ornament">
                                    </div>
                                </div>
                                <!-- BOTTOM LEFT -->
                                <div class="orn-footnote--bottom left">
                                    <!-- FLOWER -->
                                    <div class="orn-footnote--bottom-flower left">
                                        <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="2100">
                                            <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <!-- LEAF -->
                                    <div class="orn-footnote--bottom-leaf left">
                                        <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="3000" data-aos-delay="1600">
                                            <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="1200">
                                        <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- BOTTOM RIGHT -->
                                <div class="orn-footnote--bottom right">
                                    <!-- FLOWER -->
                                    <div class="orn-footnote--bottom-flower left">
                                        <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="2100">
                                            <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <!-- LEAF -->
                                    <div class="orn-footnote--bottom-leaf left">
                                        <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="3000" data-aos-delay="1600">
                                            <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="1200">
                                        <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- TOP RIGHT -->
                                <div class="orn-topcover-gate--top-right">
                                    <div class="image-wrap" data-aos="zoom-in" data-aos-duration="3000" data-aos-delay="2450">
                                        <img src="/templates/imagine/orn-15-min.png" alt="Ornament">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- DETAILS -->
                        <div class="primary-pane-details">
                            <div class="primary-pane-details--content">
                                
                                <h1 class="primary-pane-title" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">Aurora &amp; Matthew</h1>
                                
                                                                        
                                <div class="link-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="1200">
                                                                            <p data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">Hai&nbsp;Katsudoto</p>
                                    
                                    
                                                                    </div>
                            </div>
                        </div>
                    </div>

                    <section class="effects nanda" data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="500">
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                    </section>

                </div>
            </section>

            <!-- Secondary Pane -->
            <section class="secondary-pane">

                <!-- TOP COVER -->
                <section class="top-cover" data-section-order="opening_cover">

                    <div class="bg-tc" data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="100"></div>

                    <div class="top-cover-inner">

                        <div class="ornaments-wrapper">
                            <!-- TOP LEFT -->
                            <div class="orn-footnote--top-left">
                                <!-- LAMP 1 -->
                                <div class="orn-footnote--top-left--lamp-1">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="3200" data-aos-delay="3300">
                                        <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- LAMP 2 -->
                                <div class="orn-footnote--top-left--lamp-2">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="3100">
                                        <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                    </div>
                                </div>
                                
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2300">
                                    <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                                </div>
                                
                                <!-- FLOWER 1 -->
                                <div class="orn-footnote--top-left--flower-1">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2700">
                                        <img src="/templates/imagine/orn-19-min.png" alt="Ornament">
                                    </div>
                                </div>

                            </div>

                            <!-- TOP RIGHT -->
                            <div class="orn-footnote--top-right">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="3000" data-aos-delay="2450">
                                    <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                </div>
                            </div>
                        </div>

                        <!-- GARDEN -->
                        <div class="top-cover-garden">
                            <!-- GATE -->
                            <div class="top-cover-gate">
                                <div class="image-wrap" data-aos="zoom-out" data-aos-duration="2500" data-aos-delay="800">
                                    <img src="/templates/imagine/orn-10-min.png" alt="Ornament">
                                </div>
                                <div class="ornaments-wrapper">
                                    
                                    
                                    <!-- BOTTOM CENTER -->
                                    <div class="orn-footnote--bottom-center">
                                        <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3200" data-aos-delay="2200">
                                            <img src="/templates/imagine/orn-13-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <!-- BOTTOM LEFT -->
                                    <div class="orn-footnote--bottom left">
                                        <!-- FLOWER -->
                                        <div class="orn-footnote--bottom-flower left">
                                            <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="2100">
                                                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <!-- LEAF -->
                                        <div class="orn-footnote--bottom-leaf left">
                                            <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="3000" data-aos-delay="1600">
                                                <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="1200">
                                            <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <!-- BOTTOM RIGHT -->
                                    <div class="orn-footnote--bottom right">
                                        <!-- FLOWER -->
                                        <div class="orn-footnote--bottom-flower left">
                                            <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="2100">
                                                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <!-- LEAF -->
                                        <div class="orn-footnote--bottom-leaf left">
                                            <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="3000" data-aos-delay="1600">
                                                <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="1200">
                                            <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <!-- TOP RIGHT -->
                                    <div class="orn-topcover-gate--top-right">
                                        <div class="image-wrap" data-aos="zoom-in" data-aos-duration="3000" data-aos-delay="2450">
                                            <img src="/templates/imagine/orn-15-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- DETAILS -->
                            <div class="top-cover-details">
                                <div class="top-cover-details--content">
                                    <div data-aos-anchor="#ornTrigger" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="3000">
                                                                            </div>

                                    <h1 id="ornTrigger" class="top-cover-title" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="3000">Aurora &amp; Matthew</h1>
                                    
                                    <div class="link-wrap" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="3000" data-aos-anchor="#ornTrigger">
                                                                                    <p data-aos="zoom-out" data-aos-duration="1200" data-aos-anchor="#ornTrigger">Hai&nbsp;Katsudoto</p>
                                        
                                                                                    
                                                                                    
                                        <a href="javascript:;" onclick="startTheJourney()" class="link" id="startToExplore">Open Invitation</a>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <!-- <section class="effects nanda" data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="500">
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        </section> -->

                        
                    </div>
                </section>

                <!-- COVER -->
                <section class="cover-wrap" data-section-order="cover">
                    <div data-aos="zoom-in" data-aos-duration="3100" data-aos-delay="700">
                        <div class="cover-inner">

                            <div class="cover-illustration">
                                <div class="ornaments-wrapper">
                                    <!-- TOP LEFT -->
                                    <div class="orn-cover--top-left">
                                        <!-- LAMP 1 -->
                                        <div class="orn-cover--top-left--lamp-1">
                                            <div class="image-wrap" data-aos="zoom-in-down" data-aos-duration="3000" data-aos-delay="1500">
                                                <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                            </div>
                                        </div>

                                        <!-- LAMP 2 -->
                                        <div class="orn-cover--top-left--lamp-2">
                                            <div class="image-wrap" data-aos="zoom-in-down" data-aos-duration="3000" data-aos-delay="1700">
                                                <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                            </div>
                                        </div>

                                        <!-- FLOWER 1 -->
                                        <div class="orn-cover--top-left--flower-1">
                                            <div class="image-wrap" data-aos="zoom-in-down" data-aos-duration="3000" data-aos-delay="1450">
                                                <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                            </div>
                                        </div>

                                        <div class="image-wrap" data-aos="zoom-in-down" data-aos-duration="3000" data-aos-delay="1200">
                                            <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <!-- TOP RIGHT -->
                                    <div class="orn-cover--top-right">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="3500" data-aos-delay="1950">
                                            <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <!-- BOTTOM LEFT -->
                                    <div class="orn-cover--bottom-left">
                                        <!-- FLOWER 2 -->
                                        <div class="orn-cover--bottom-left--flower-2">
                                            <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3500" data-aos-delay="1900">
                                                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                            </div>
                                        </div>
        
                                        <!-- FLOWER 1 -->
                                        <div class="orn-cover--bottom-left--flower-1">
                                            <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="1500">
                                                <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                            </div>
                                        </div>
        
                                            <div class="image-wrap" data-aos="zoom-in-up" data-aos-duration="3000" data-aos-delay="1200">
                                            <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                </div>
                                
                                <section class="effects nanda" data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="1500">
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                    <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                                </section>
                            </div>
                            <div class="cover-highlight">
                                    <div class="cover-body">
        <!-- PREVIEW -->
        <div class="cover-preview-wrap" data-aos-duration="3000" data-aos-delay="1400">
            <div class="cover-preview cover-show" id="cover-main"></div>
        </div>
        <div data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="400">
        </div>
    </div>
                                <div class="cover-details">
                                                                            <p class="top-text" data-aos="fade-down" data-aos-duration="3500" data-aos-delay="1400">
                                            Wedding Invitation                                        </p>
                                            
                                                                            <h1 class="prime-title" data-aos="zoom-in" data-aos-duration="3500" data-aos-delay="1700">
                                            Aurora<br>&<br>Matthew                                        </h1>
                                            
                                                                            <p class="bottom-text" data-aos="fade-up" data-aos-duration="3500" data-aos-delay="1400">
                                            #PromDateToLifeMate                                        </p>
                                    
                                                                            <div class="torsvp__btn-wrap" data-aos="fade-up" data-aos-duration="3500" data-aos-delay="1900">
                                            <a href="#toRsvp" class="torsvp__btn">RSVP</a>
                                            <div class="arrow">
                                                <i class="ph ph-caret-down"></i>
                                                <i class="ph ph-caret-down"></i>
                                                <i class="ph ph-caret-down"></i>
                                            </div>
                                        </div>

                                                                    </div>

                            </div>

                        </div>
                    </div>
                </section>

                                    <!-- Quote -->
                    <section class="quote-wrap" data-section-order="quote">
                        <div class="quote-inner">
                            <div class="ornaments-wrapper">
                                <!-- TOP RIGHT -->
                                <div class="orn-quote--top-right">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                        <img src="/templates/imagine/orn-06-min.png" alt="Ornament">
                                    </div>

                                    <!-- FLOWER 1 -->
                                    <div class="orn-quote--top-right--flower-1">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                            <img src="/templates/imagine/orn-05-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <!-- FLOWER 2 -->
                                    <div class="orn-quote--top-right--flower-2">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="700">
                                            <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                </div>

                                <!-- BOTTOM LEFT -->
                                <div class="orn-quote--top-right bottom-left">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                        <img src="/templates/imagine/orn-06-min.png" alt="Ornament">
                                    </div>

                                    <!-- FLOWER 1 -->
                                    <div class="orn-quote--top-right--flower-1">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                            <img src="/templates/imagine/orn-05-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <!-- FLOWER 2 -->
                                    <div class="orn-quote--top-right--flower-2">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="700">
                                            <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                </div>

                                <!-- BOTTOM RIGHT -->
                                <div class="orn-quote--bottom-right">
                                    <!-- flower 1 -->
                                    <div class="orn-quote--bottom-right--flower-1">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                            <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                        <img src="/templates/imagine/orn-08-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- TOP LEFT -->
                                <div class="orn-quote--bottom-right top-left">
                                    <!-- flower 1 -->
                                    <div class="orn-quote--bottom-right--flower-1">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                            <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                        </div>
                                    </div>

                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                        <img src="/templates/imagine/orn-08-min.png" alt="Ornament">
                                    </div>
                                </div>
                            </div>
                            <div class="quote">
                                <p class="quote-caption" data-aos="fade-up" data-aos-duration="1000">"And among His Signs is this, that He created for you mates from among yourselves, that He may dwell in tranquillity with them, and He has put love and mercy between your (hearts): verily in that are Signs for those who reflect."<br />
<br />
(QS. Ar-Rum: 21)</p>
                            </div>
                        </div>
                    </section>
                
                <!-- COUPLE -->
                <section class="couple-wrap" data-section-order="couple">
                    <div class="ornaments-wrapper">
                        <!-- TOP -->
                        <div class="orn-couple--top">
                            <!-- LAMP 1 -->
                            <div class="orn-couple--top--lamp left">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                    <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                </div>
                            </div>

                            <!-- LAMP 2 -->
                            <div class="orn-couple--top--lamp right">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="700">
                                    <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                </div>
                            </div>
                            
                            <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                            </div>

                            <!-- FLOWER 1 -->
                            <div class="orn-couple--top-left--flower-1">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                    <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                </div>
                            </div>

                            <!-- TOP RIGHT -->
                            <div class="orn-couple--top-right">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                    <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="couple">
                                                    <div class="couple-head">


                                <h1 class="couple-title" data-aos="zoom-in" data-aos-duration="1000">The Wedding Of</h1>                                <p class="couple-description" data-aos="fade-up" data-aos-duration="1000">Assalamualaikum Warahmatullahi Wabarakatuh<br />
With the blessing and mercy from Allah SWT,<br />
We cordially invite you to the wedding of</p>                            </div>
                        
                        <div
                            class="couple-body  bride-first   show-picture  ">
                            <div class="couple-info groom">
                                <div class="couple-preview">
                                            
                                                    <div class="couple-frame">

                                                        <!-- BOTTOM LEFT -->
                                                        <div class="orn-couple-frame--bottom left">
                                                            <!-- FLOWER -->
                                                            <div class="orn-couple-frame--bottom-flower-left">
                                                                <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                                                </div>
                                                            </div>
                                                            <!-- LEAF -->
                                                            <div class="orn-couple-frame--bottom-leaf left">
                                                                <div class="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                                                                </div>
                                                            </div>
                                                            <div class="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="700">
                                                                <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                                            </div>
                                                        </div>

                                                        <!-- BOTTOM RIGHT -->
                                                        <div class="orn-couple-frame--bottom right">
                                                            <!-- LEAF -->
                                                            <div class="orn-couple-frame--bottom-leaf right">
                                                                <div class="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                                                                </div>
                                                            </div>
                                                            <div class="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="700">
                                                                <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                                            </div>
                                                            <!-- LEAF 2 -->
                                                            <div class="orn-couple-frame--bottom-leaf-2">
                                                                <div class="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-15-min.png" alt="Ornament">
                                                                </div>
                                                            </div>
                                                            <!-- FLOWER -->
                                                            <div class="orn-couple-frame--bottom-flower-right">
                                                                <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-21-min.png" alt="Ornament">
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- TOP LEFT -->
                                                        <div class="orn-couple-frame--top-left">
                                                            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                                                                <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                                            </div>
                                                        </div>

                                                        <div class="couple-picture-wrap">
                                                            <div class="couple-picture lightgallery" data-aos="zoom-out" data-aos-duration="1000">
                                                                <a class="img-wrap" href="/templates/imagine/orn-20-min.png" target="_blank">
                                                                    <img class="img" src="/templates/imagine/orn-20-min.png" alt="">
                                                                </a>
                                                            </div>
                                                        </div>

                                                        <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                                                            <img src="/templates/imagine/orn-2-min.png" alt="Ornament">
                                                        </div>

                                                    </div>
                                                </div>
                                <div class="couple-details">
                                    <h2 class="couple-name" data-aos="fade-up" data-aos-duration="1000">Matthew Leonard</h1>                                    <p class="couple-parents" data-aos="fade-up" data-aos-duration="1000">Son of Mr. Randy Louwis and Mrs. Lenita</p>                                    
                                    <div class="couple-link-wrap" data-aos="fade-up" data-aos-duration="1000">
                                                    <a href="/templates/imagine/orn-20-min.png" target="_blank" class="couple-link"><i class="fab fa-instagram"></i> @katsudoto</a>
                                                </div>                                </div>
                            </div>

                                                            <div class="separator-wrap">
                                    <div class="separator" data-aos="zoom-in" data-aos-duration="1500">
                                        <div class="divider"></div>
                                        <h2 class="couple-separator">&amp;</h2>
                                        <div class="divider"></div>
                                    </div>
                                </div>
                            
                                                            <div class="couple-info bride">
                                    <div class="couple-preview">
                                                        <div class="couple-frame">

                                                            <!-- BOTTOM LEFT -->
                                                            <div class="orn-couple-frame--bottom left">
                                                                <!-- FLOWER -->
                                                                <div class="orn-couple-frame--bottom-flower-left">
                                                                    <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="700">
                                                                        <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                                                    </div>
                                                                </div>
                                                                <!-- LEAF -->
                                                                <div class="orn-couple-frame--bottom-leaf left">
                                                                    <div class="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="700">
                                                                        <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                                                                    </div>
                                                                </div>
                                                                <div class="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                                                </div>
                                                            </div>

                                                            <!-- BOTTOM RIGHT -->
                                                            <div class="orn-couple-frame--bottom right">
                                                                <!-- LEAF -->
                                                                <div class="orn-couple-frame--bottom-leaf right">
                                                                    <div class="image-wrap" data-aos="fade-left" data-aos-duration="1200" data-aos-delay="700">
                                                                        <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                                                                    </div>
                                                                </div>
                                                                <div class="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                                                </div>
                                                                <!-- LEAF 2 -->
                                                                <div class="orn-couple-frame--bottom-leaf-2">
                                                                    <div class="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="700">
                                                                        <img src="/templates/imagine/orn-15-min.png" alt="Ornament">
                                                                    </div>
                                                                </div>
                                                                <!-- FLOWER -->
                                                                <div class="orn-couple-frame--bottom-flower-right">
                                                                    <div class="image-wrap" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="700">
                                                                        <img src="/templates/imagine/orn-21-min.png" alt="Ornament">
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <!-- TOP LEFT -->
                                                            <div class="orn-couple-frame--top-left">
                                                                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                                                                    <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                                                </div>
                                                            </div>

                                                            <div class="couple-picture-wrap">
                                                                <div class="couple-picture lightgallery" data-aos="zoom-out" data-aos-duration="1000">
                                                                    <a class="img-wrap" href="/templates/imagine/orn-20-min.png" target="_blank">
                                                                        <img class="img" src="/templates/imagine/orn-20-min.png" alt="">
                                                                    </a>
                                                                </div>
                                                            </div>

                                                            <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                                                                <img src="/templates/imagine/orn-2-min.png" alt="Ornament">
                                                            </div>


                                                        </div>
                                                    </div>
                                    <div class="couple-details">
                                        <h2 class="couple-name" data-aos="fade-up" data-aos-duration="1000">Aurora Isabella</h2>                                        <p class="couple-parents" data-aos="fade-up" data-aos-duration="1000">Daughter of Mr. Tian and Mrs. Gea</p>                                        
                                        <div class="couple-link-wrap" data-aos="fade-up" data-aos-duration="1000">
                                                        <a href="/templates/imagine/orn-20-min.png" target="_blank" class="couple-link"><i class="fab fa-instagram"></i> @katsudoto</a>
                                                    </div>                                    </div>
                                </div>
                                                    </div>

                    </div>
                </section>

                <!-- SAVEDATE -->
                <section class="savedate-agenda-wrapper" data-section-order="save_the_date">

                    <!-- SAVE THE DATE -->
                    <section class="save-date-wrap">

                        <div class="save-date-head">
                            <h1 class="save-date-title" data-aos="zoom-in" data-aos-duration="1000">Save The Date</h1>
                        </div>

                        <div class="save-date-frame">
                            <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                                <img src="/templates/imagine/orn-23-min.png" alt="Ornament">
                            </div>
                            <div class="ornaments-wrapper">

                                <!-- BOTTOM LEFT -->
                                <div class="orn-save-date-bottom left">
                                    <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">
                                        <img src="/templates/imagine/orn-01-min.png" alt="">
                                    </div>
                                </div>
                                <!-- BOTTOM RIGHT -->
                                <div class="orn-save-date-bottom right">
                                    <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">
                                        <img src="/templates/imagine/orn-01-min.png" alt="">
                                    </div>
                                </div>

                                <!-- TOP LEFT -->
                                <div class="orn-save-date-top left">
                                    <div class="orn-save-date-leaf left">
                                        <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">
                                            <img src="/templates/imagine/orn-22-min.png" alt="">
                                        </div>
                                    </div>
                                    <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="150">
                                        <img src="/templates/imagine/orn-05-min.png" alt="">
                                    </div>
                                </div>

                                <!-- TOP RIGHT -->
                                <div class="orn-save-date-top right">
                                    <div class="orn-save-date-leaf right">
                                        <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">
                                            <img src="/templates/imagine/orn-22-min.png" alt="">
                                        </div>
                                    </div>
                                    <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="150">
                                        <img src="/templates/imagine/orn-05-min.png" alt="">
                                    </div>
                                </div>
                            </div>
                            <div class="save-date">
                                <!-- <div class="save-date-head">
                                                                            <p class="save-date-event" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">September, 9th 2023</p>
                                                                    </div> -->
                                                                <div class="save-date-body">
                                    <div class="countdown">
                                        <div class="count-item" data-aos="fade-down-right" data-aos-duration="1200" data-aos-delay="100">
                                            <h2 class="count-num count-day">0</h2>
                                            <small class="count-text">Days</small>
                                        </div>
                                        <div class="count-item" data-aos="fade-down-left" data-aos-duration="1200" data-aos-delay="300">
                                            <h2 class="count-num count-hour">0</h2>
                                            <small class="count-text">Hours</small>
                                        </div>
                                        <div class="count-item" data-aos="fade-up-right" data-aos-duration="1200" data-aos-delay="500">
                                            <h2 class="count-num count-minute">0</h2>
                                            <small class="count-text">Minutes</small>
                                        </div>
                                        <div class="count-item" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="700">
                                            <h2 class="count-num count-second">0</h2>
                                            <small class="count-text">Seconds</small>
                                        </div>
                                    </div>
                                </div>
                                   
                            </div>
                        </div>
                                                    <div class="add-to-calendar-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="1100">
                                <a class="add-to-calendar" href="https://www.google.com/calendar/render?action=TEMPLATE&amp;text=Aurora+%26+Matthew+Wedding&amp;dates=20241005T110000/20241005T170000&amp;location=JW+Marriott+Jakarta+%7C+JW+Marriott+Jkt%2C+Kuningan%2C+Kuningan+Tim.%2C+Kecamatan+Setiabudi%2C+Kota+Jakarta+Selatan%2C+Daerah+Khusus+Ibukota+Jakarta+12950%2C+Indonesia+%7C+Kota+Jakarta+Selatan&amp;details=Hi%2C+You%27re+invited+to+our+wedding+ceremony+%7C+Aurora+%26+Matthew+Wedding+%7C+Saturday%2C+October+05th+2024" target="_blank" rel="nofollow" id="addToCalendar">
                                Add to Calendar                                </a>
                            </div>
                                            </section>

                </section>

                <section class="savedate-agenda-wrapper" data-section-order="event">

                    <!-- AGENDA -->
                    <section class="agenda-wrap">
                        <div class="agenda-inner">
                                
                            <div class="agenda-head">
                                <h2 class="agenda-title" data-aos="zoom-in" data-aos-duration="1500">It&#039;s Wedding Day</h2>                                <p class="agenda-description" data-aos="fade-up" data-aos-duration="1200">We cordially invite you attend our wedding</p>                            </div>

                            <div class="agenda-body">

                                <div class="event-item">
                                                <div class="event-head">
                                                    <div class="event-schedule-wrapper">
                                                        <p class="event-day" data-aos="fade-up" data-aos-duration="1000">Saturday</p>
                                                        <div class="event-schedule-inner">
                                                            <h1 class="event-date" data-aos="fade-up" data-aos-duration="1000">05</h1>
                                                            <p class="event-year" data-aos="fade-up" data-aos-duration="1000">2024</p>
                                                        </div>
                                                        <p class="event-month" data-aos="fade-up" data-aos-duration="1000">October</p>
                                                    </div>
                                                    
                                                </div><div class="activity-wrap  same-location "><div class="activity-item">
                                                                <!-- FRAME -->
        <!-- FLOWER BACK WRAPPER -->
    <div class="ornaments-wrapper">
        <!-- TOP LEFT -->
        <div class="activity-frame--top-left-back">
            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
            </div>
        </div>
    </div>
    <div class="activity-frame first">
        <div class="image-wrap" data-aos="zoom-out" data-aos-duration="2000">
            <img src="/templates/imagine/orn-10-min.png" alt="Ornament">
        </div>
            <!-- FLOWERS WRAPPER -->
    <div class="ornaments-wrapper">
        <!-- BOTTOM LEFT -->
        <div class="activity-frame--bottom-left">
            <!-- FLOWER 3 -->
            <div class="activity-frame--bottom-left--flower-3">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">
                    <img src="/templates/imagine/orn-05-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 2 -->
            <div class="activity-frame--bottom-left--flower-2">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">
                    <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 1 -->
            <div class="activity-frame--bottom-left--flower-1">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                </div>
            </div>

            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
            </div>
        </div>

        <!-- BOTTOM RIGHT -->
        <div class="activity-frame--bottom-right">
            <!-- FLOWER 4 -->
            <div class="activity-frame--bottom-right--flower-4">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                    <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                </div>
            </div>
            <!-- FLOWER 3 -->
            <div class="activity-frame--bottom-right--flower-3">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                    <img src="/templates/imagine/orn-05-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 2 -->
            <div class="activity-frame--bottom-right--flower-2">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="500">
                    <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 1 -->
            <div class="activity-frame--bottom-right--flower-1">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                </div>
            </div>

            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="100">
                <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
            </div>
        </div>

        <!-- TOP LEFT -->
        <div class="activity-frame--top-left">
            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">
                <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
            </div>
        </div>

        <!-- TOP RIGHT -->
        <div class="activity-frame--top-right">
            <div class="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="600">
                <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
            </div>
        </div>
    </div>
    </div>

                                                            <div class="activity-content">                                                                                                   
                                                                <div class="activity-head">
                                                                    <div data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">    <svg class="activity-icon ic-rings" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M322.656 180C318.656 180 314.736 180.24 310.896 180.48C316.684 187.936 321.848 195.856 326.336 204.16C359.969 205.08 391.885 219.212 415.174 243.494C438.464 267.776 451.251 300.254 450.767 333.896C450.283 367.538 436.567 399.635 412.589 423.238C388.611 446.84 356.301 460.047 322.656 460C288.719 459.964 256.183 446.467 232.186 422.47C208.189 398.473 194.692 365.937 194.656 332C194.763 307.79 201.686 284.099 214.632 263.641C227.578 243.182 246.023 226.783 267.856 216.32C262.787 209.693 256.99 203.655 250.576 198.32C215.726 217.068 189.57 248.678 177.676 286.421C165.783 324.164 169.09 365.059 186.896 400.4C199.641 425.478 219.059 446.552 243.013 461.302C266.966 476.052 294.525 483.907 322.656 484C362.969 484 401.63 467.986 430.136 439.48C458.642 410.975 474.656 372.313 474.656 332C474.656 291.687 458.642 253.025 430.136 224.52C401.63 196.014 362.969 180 322.656 180Z" fill="black"/>
        <path d="M326.336 204.16C321.848 195.856 316.684 187.936 310.896 180.48C301.929 180.427 277.311 183.92 250.576 198.32C256.99 203.655 262.787 209.693 267.856 216.32C291.656 204.914 295.656 204.16 326.336 204.16Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M88.1948 193.539C64.1998 217.534 50.6999 250.066 50.6554 284C50.7034 317.286 63.7079 349.246 86.9137 373.108C110.12 396.971 141.704 410.863 174.975 411.84C179.463 420.144 190.415 435.52 190.415 435.52C190.415 435.52 182.655 436 178.655 436C139.887 435.912 102.618 421.014 74.4718 394.354C46.3258 367.693 29.4305 331.286 27.2425 292.579C25.0544 253.873 37.739 215.793 62.7011 186.13C87.6632 156.468 123.016 137.465 161.527 133.008C168.656 132.183 188.156 132.141 195.791 133C231.547 137.024 264.698 153.659 289.295 179.92C299.376 190.515 307.84 202.537 314.415 215.6C332.221 250.941 335.529 291.836 323.635 329.579C311.741 367.322 285.585 398.932 250.735 417.68C244.321 412.345 238.525 406.307 233.455 399.68C255.288 389.217 273.734 372.818 286.679 352.359C299.625 331.901 306.548 308.21 306.655 284C306.619 250.063 293.122 217.527 269.125 193.53C245.128 169.533 212.592 156.036 178.655 156C144.721 156.044 112.19 169.544 88.1948 193.539Z" fill="black"/>
        <path d="M250.735 417.68C244.321 412.345 238.525 406.307 233.455 399.68C224.735 404.513 200.831 413.712 174.975 411.84C179.463 420.144 190.415 435.52 190.415 435.52C223.656 432.5 228.156 429.827 250.735 417.68Z" fill="black"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M333.641 182.592L352.093 184.446L368.016 189.279L368.501 147.421L393.841 155.379L370.306 189.998L386.134 195.137L402.333 204.165L456.302 172.229C457.596 171.479 458.653 170.379 459.35 169.056C460.048 167.732 460.358 166.239 460.245 164.747L456.965 121.791C456.846 120.193 456.249 118.668 455.253 117.413C454.257 116.158 452.906 115.231 451.377 114.753L344.523 81.1935C342.995 80.7119 341.358 80.7003 339.823 81.1602C338.288 81.62 336.927 82.5301 335.915 83.7726L308.665 117.141C307.719 118.3 307.119 119.702 306.935 121.187C306.75 122.672 306.989 124.178 307.622 125.534L333.641 182.592ZM386.134 195.137L409.716 160.365L432.766 167.605L386.134 195.137ZM352.093 184.446L329.576 135.196L352.625 142.435L352.093 184.446ZM441.393 128.388L436.508 126.854L420.158 146.874L443.361 154.161L441.393 128.388ZM403.672 141.697L420.022 121.676L366.29 104.8L368.258 130.574L403.672 141.697ZM349.804 99.6225L344.919 98.0884L328.569 118.109L351.772 125.396L349.804 99.6225Z" fill="black"/>
        <path d="M418.763 71.8016L424.765 46.9105C426.059 41.5418 422.755 36.1381 417.389 34.8458C412.019 33.5515 406.618 36.8545 405.324 42.2227L399.322 67.1138C398.238 71.6104 400.378 76.1293 404.256 78.2398C405.008 78.649 405.826 78.9683 406.698 79.1785C412.068 80.4728 417.469 77.1711 418.763 71.8016Z" fill="black"/>
        <path d="M369.406 67.3112L362.091 39.0568C360.708 33.7114 355.251 30.498 349.905 31.8827C344.559 33.2666 341.347 38.7229 342.731 44.0688L350.046 72.3232C350.769 75.1142 352.601 77.3236 354.949 78.6014C357.097 79.7706 359.678 80.1589 362.233 79.4978C367.578 78.1143 370.789 72.6566 369.406 67.3112Z" fill="black"/>
        <path d="M477.463 66.9405C473.293 63.3221 466.976 63.7665 463.357 67.9378L444.67 89.467C441.049 93.6374 441.497 99.9527 445.667 103.573C446.227 104.059 446.824 104.47 447.45 104.81C451.484 107.006 456.639 106.186 459.773 102.576L478.46 81.0463C482.081 76.8759 481.633 70.5602 477.463 66.9405Z" fill="black"/>
    </svg></div>
                                                                    <h3 class="activity-title" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">Akad Nikah</h3>
                                                                    
                                                                    <p class="activity-time" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">09:00 - 10:00</p>
                                                                </div><div class="event-details">
                                                                            <p class="event-hall" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">JW Marriott Jakarta</p>
                                                                            <p class="event-address" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">JW Marriott Jkt, Kuningan, Kuningan Tim., Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12950, Indonesia</p>
                                                                            <p class="event-city" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">Kota Jakarta Selatan</p>
                                                                            <div class="event-link-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom"><a href="https://maps.google.com/?q=JW+Marriott+Jakarta&amp;ftid=0x2e69f3fad694635d:0x7955433b5d801fd6" class="event-link" target="_blank">View Maps</a></div>
                                                                        </div></div>
                                                        </div><div class="activity-item">
                                                                <!-- FRAME -->
        <!-- FLOWER BACK WRAPPER -->
    <div class="ornaments-wrapper">
        <!-- TOP LEFT -->
        <div class="activity-frame--top-left-back">
            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
            </div>
        </div>
    </div>
    <div class="activity-frame ">
        <div class="image-wrap" data-aos="zoom-out" data-aos-duration="2000">
            <img src="/templates/imagine/orn-10-min.png" alt="Ornament">
        </div>
            <!-- FLOWERS WRAPPER -->
    <div class="ornaments-wrapper">
        <!-- BOTTOM LEFT -->
        <div class="activity-frame--bottom-left">
            <!-- FLOWER 3 -->
            <div class="activity-frame--bottom-left--flower-3">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">
                    <img src="/templates/imagine/orn-05-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 2 -->
            <div class="activity-frame--bottom-left--flower-2">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">
                    <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 1 -->
            <div class="activity-frame--bottom-left--flower-1">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                </div>
            </div>

            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
            </div>
        </div>

        <!-- BOTTOM RIGHT -->
        <div class="activity-frame--bottom-right">
            <!-- FLOWER 4 -->
            <div class="activity-frame--bottom-right--flower-4">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                    <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                </div>
            </div>
            <!-- FLOWER 3 -->
            <div class="activity-frame--bottom-right--flower-3">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="700">
                    <img src="/templates/imagine/orn-05-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 2 -->
            <div class="activity-frame--bottom-right--flower-2">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="500">
                    <img src="/templates/imagine/orn-04-min.png" alt="Ornament">
                </div>
            </div>

            <!-- FLOWER 1 -->
            <div class="activity-frame--bottom-right--flower-1">
                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                </div>
            </div>

            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="100">
                <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
            </div>
        </div>

        <!-- TOP LEFT -->
        <div class="activity-frame--top-left">
            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">
                <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
            </div>
        </div>

        <!-- TOP RIGHT -->
        <div class="activity-frame--top-right">
            <div class="image-wrap" data-aos="fade-right" data-aos-duration="1200" data-aos-delay="600">
                <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
            </div>
        </div>
    </div>
    </div>

                                                            <div class="activity-content">                                                                                                   
                                                                <div class="activity-head">
                                                                    <div data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="100">    <svg class="activity-icon ic-wine" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_3167_46)">
            <path d="M291.89 66.15C292.629 66.317 293.367 66.397 294.094 66.397C298.66 66.397 302.782 63.241 303.827 58.592L313.485 15.664C314.697 10.276 311.318 4.92399 305.937 3.70999C300.556 2.49299 295.212 5.87999 293.999 11.268L284.341 54.196C283.13 59.584 286.51 64.936 291.89 66.15Z" fill="black"/>
            <path d="M244.82 52.527C246.72 55.538 249.96 57.186 253.272 57.186C255.096 57.186 256.943 56.685 258.598 55.638C263.26 52.687 264.652 46.51 261.705 41.841L238.239 4.65899C235.293 -0.0100131 229.124 -1.40101 224.461 1.54699C219.799 4.49799 218.407 10.675 221.354 15.344L244.82 52.527Z" fill="black"/>
            <path d="M334.915 75.605C336.74 75.605 338.586 75.104 340.243 74.056L377.404 50.528C382.066 47.576 383.456 41.399 380.508 36.731C377.561 32.064 371.392 30.671 366.73 33.623L329.569 57.15C324.907 60.102 323.517 66.279 326.465 70.947C328.365 73.957 331.604 75.605 334.915 75.605Z" fill="black"/>
            <path d="M458.873 433.94L395.627 406.67L375.351 330.873C401.52 321.084 423.744 300.848 435.942 275.231C447.87 250.18 448.672 222.818 438.271 197.916C438.196 197.732 437.583 196.296 437.345 195.764L393.87 98.387C391.867 93.901 386.905 91.537 382.168 92.809L286.61 118.444L288.076 104.279C288.579 99.418 285.5 94.905 280.795 93.607L249.515 84.975C249.451 84.9575 249.388 84.9406 249.324 84.9244C244.067 83.582 238.681 86.6976 237.234 91.959C235.769 97.284 238.892 102.79 244.209 104.257L267.336 110.639L263.067 151.886C234.703 138.863 197.465 140.254 171.788 156.755C150.985 170.124 117.919 170.342 95.5626 158.187L132.89 74.612L158.106 81.381C158.124 81.386 158.143 81.391 158.162 81.3959C163.469 82.7898 168.915 79.6283 170.338 74.311C171.766 68.976 168.605 63.493 163.278 62.062L129.836 53.084C125.099 51.811 120.136 54.175 118.133 58.66L74.6266 156.069C63.2726 181.526 63.7746 209.736 76.0406 235.503C88.2396 261.129 110.476 281.378 136.65 291.174L116.375 366.97L53.1226 394.216C41.8566 399.082 34.7956 410.324 35.5536 422.191C36.3096 434.042 44.7606 443.7 57.6086 447.394C57.6666 447.411 57.7246 447.427 57.7826 447.442L146.202 471.144C146.254 471.158 146.307 471.172 146.36 471.185C149.299 471.922 152.194 472.281 154.992 472.281C164.558 472.281 172.985 468.085 178.074 460.439C184.661 450.543 184.161 437.274 176.827 427.416L135.67 372.15L155.944 296.358C161.798 297.341 167.732 297.831 173.674 297.831C195.711 297.83 217.838 291.161 236.234 278.49C237.849 277.378 239.417 276.224 240.946 275.038C248.337 293.661 261.721 309.558 279.739 320.794C297.299 331.745 318.045 337.48 338.547 337.48C344.431 337.48 350.294 337.003 356.056 336.046L376.332 411.845L335.174 467.114C327.836 476.969 327.325 490.239 333.903 500.135C338.995 507.796 347.43 512 357.008 512C359.794 512 362.679 511.644 365.604 510.914C365.661 510.9 365.717 510.885 365.774 510.87L454.193 487.14C454.249 487.125 454.305 487.109 454.36 487.094C467.233 483.398 475.695 473.731 476.445 461.867C477.195 450.004 470.129 438.78 458.873 433.94ZM284.406 139.742L379.111 114.336L416.419 197.9C394.072 210.057 361.008 209.833 340.189 196.454C323.826 185.928 301.644 181.293 279.882 183.444L284.406 139.742ZM161.455 449.348C158.993 453.048 154.056 452.486 151.281 451.802L63.0446 428.15C60.3076 427.351 55.7716 425.36 55.4876 420.919C55.3096 418.136 56.9696 414.341 61.0256 412.588L121.476 386.549L160.812 439.371C163.454 442.92 162.997 447.031 161.455 449.348ZM224.916 262.011C203.851 276.52 175.667 281.466 151.343 274.916L151.341 274.915C151.341 274.915 151.339 274.915 151.337 274.914L151.334 274.913C127.016 268.407 105.074 250.009 94.0716 226.897C86.3976 210.776 84.5466 193.494 88.5086 177.071C101.839 183.799 117.367 187.214 132.846 187.213C150.652 187.212 168.384 182.709 182.577 173.588C204.023 159.804 238.499 159.988 260.853 173.289L257.225 208.343C254.974 230.152 243.5 249.211 224.916 262.011ZM290.299 303.816C273.397 293.276 261.669 277.672 256.853 259.528C268.189 245.571 275.197 228.766 277.093 210.402L277.771 203.851C296.429 201.048 315.693 204.467 329.398 213.284C343.608 222.416 361.346 226.923 379.161 226.923C394.633 226.923 410.153 223.509 423.474 216.785C427.439 233.215 425.59 250.5 417.913 266.622C406.913 289.725 384.986 308.109 360.664 314.61H360.662L360.659 314.611C360.656 314.612 360.653 314.613 360.65 314.614C337.463 320.864 311.163 316.828 290.299 303.816ZM448.929 467.845L360.697 491.525C357.923 492.205 352.992 492.758 350.531 489.054C348.991 486.737 348.54 482.625 351.187 479.07L390.524 426.247L450.981 452.315C455.03 454.056 456.685 457.832 456.51 460.604C456.231 465.051 451.676 467.044 448.929 467.845Z" fill="black"/>
            <path d="M237.234 91.959C238.681 86.6976 244.067 83.582 249.324 84.9244L163.278 62.062C168.605 63.493 171.766 68.976 170.338 74.311C168.915 79.6283 163.469 82.7898 158.162 81.3959L244.209 104.257C238.892 102.79 235.769 97.284 237.234 91.959Z" fill="black"/>
        </g>
        <defs>
            <clipPath id="clip0_3167_46">
                <rect width="512" height="512" fill="white"/>
            </clipPath>
        </defs>
    </svg></div>
                                                                    <h3 class="activity-title" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">Resepsi</h3>
                                                                    
                                                                    <p class="activity-time" data-aos="zoom-in" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">11:00 - 17:00</p>
                                                                </div><div class="event-details">
                                                                            <p class="event-hall" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">JW Marriott Jakarta</p>
                                                                            <p class="event-address" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">JW Marriott Jkt, Kuningan, Kuningan Tim., Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12950, Indonesia</p>
                                                                            <p class="event-city" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom">Kota Jakarta Selatan</p>
                                                                            <div class="event-link-wrap" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400" data-aos-anchor-placement="bottom-bottom"><a href="https://maps.google.com/?q=JW+Marriott+Jakarta&amp;ftid=0x2e69f3fad694635d:0x7955433b5d801fd6" class="event-link" target="_blank">View Maps</a></div>
                                                                        </div></div>
                                                        </div></div>    <div class="dress-wrapper same-location">
        <div class="dress-inner">
                <div class="dress-header" data-aos="fade-up" data-aos-duration="1000">
        <h2 class="dress-title">Dresscode</h2>
            <p class="dress-desc">Black Theme</p>
    </div>
                <div class="dress-body">
        <div class="dress-list" data-aos="fade-up" data-aos-duration="1000">
                <div class="dress-item">
        <p class="dress-item-title">Men</p>
            <div class="dress-preview man-preview">
            <div class="dress-thumb lightgallery">
        <a class="dress-thumb-item" href="/templates/imagine/orn-20-min.png" target="_blank">
            <img class="dress-thumb-img" src="/templates/imagine/orn-20-min.png" alt="Man Dress" class="dress-thumb-img" width="92" height="92">
        </a>
    </div>
    </div>
        
    </div>
                <div class="dress-item">
        <p class="dress-item-title">Women</p>
            <div class="dress-preview woman-preview">
            <div class="dress-thumb lightgallery">
        <a class="dress-thumb-item" href="/templates/imagine/orn-20-min.png" target="_blank">
            <img class="dress-thumb-img" src="/templates/imagine/orn-20-min.png" alt="Woman Dress" class="dress-thumb-img">
        </a>
    </div>
    </div>
        
    </div>
        </div>
    </div>
                <div class="dress-footer"  data-aos="fade-up" data-aos-duration="1000">
        <p class="dress-note">Wear clothes with black and red shades</p>
    </div>
        </div>
    </div></div>                                
                            </div>

                            
                        </div>
                    </section>

                </section>

                <section class="savedate-agenda-wrapper" data-section-order="rundown">

                    
                </section>


                                    <div data-section-order="rsvp">
                                                    <!-- Reservation -->
                            <section class="rsvp-wrap" id="toRsvp">
                                <div class="ornaments-wrapper">
                                    <!-- TOP -->
                                    <div class="orn-couple--top">
                                        <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                            <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                                        </div>

                                        <!-- FLOWER 1 -->
                                        <div class="orn-couple--top-left--flower-1">
                                            <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                                <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                            </div>
                                        </div>

                                        <!-- TOP RIGHT -->
                                        <div class="orn-couple--top-right">
                                            <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                                <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="rsvp-inner">

                                    <div class="rsvp-head">
                                        <h1 class="rsvp-title" data-aos="zoom-in" data-aos-duration="1500">RSVP</h1>

                                                                            </div>

                                    <div class="rsvp-body">                

                                    </div>

                                </div>
                            </section>
                                            </div>
                
                <!-- LIVE STREAMING -->
                        <section class="live-streaming" data-section-order="live_streaming">
                            <div class="inner">
                                <div class="head">
                                    <h1 data-aos="zoom-in" data-aos-duration="1000">Live Streaming</h1>
                                </div>
                                <div class="body">
                                    <div class="streaming-info"><div>
                                                <div class="preview  wide  youtube " data-aos="fade-up" data-aos-duration="1000">
                                                    <img src="/templates/imagine/orn-20-min.png" alt="">
                                                    <button class="play-btn" data-video-id="IjPef0ETzRY"><i class="fas fa-play"></i></button>
                                                </div>
                                            </div>
                                            
                                            </div>
                                </div>
                            </div>
                        </section>
                                    <!-- PHOTO -->
                    <section class="photo-wrap" data-section-order="gallery_photo">
                        <div class="ornaments-wrapper">
                            <!-- TOP -->
                            <div class="orn-couple--top">
                                <!-- LAMP 1 -->
                                <div class="orn-couple--top--lamp left">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                        <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- LAMP 2 -->
                                <div class="orn-couple--top--lamp right">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="700">
                                        <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                    </div>
                                </div>
                                
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                    <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                                </div>

                                <!-- FLOWER 1 -->
                                <div class="orn-couple--top-left--flower-1">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                        <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- TOP RIGHT -->
                                <div class="orn-couple--top-right">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                        <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="photo-inner">

                           

                                                            <div class="photo-head">
                                    <h1 class="photo-title" data-aos="fade-up" data-aos-duration="1000">Gallery Of Us</h1>                                                                    </div>
                            
                            
                            <div class="photo-body">                
                                <div class="photo-box">

                                        <div class="aine-photos lightgallery " data-num="5">
            <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609607.jpg">
    </a>    <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609613 (1).jpg">
    </a>    <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609598.jpg">
    </a>    <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609643.jpg">
    </a>    <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609660.jpg">
    </a>
    </div>    <div class="aine-photos lightgallery " data-num="2">
            <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609594.jpg">
    </a>    <a data-aos="zoom-in" data-aos-duration="1000" href="/templates/imagine/orn-20-min.png" target="_blank">
        <img src="/templates/imagine/orn-20-min.png" alt="2149609634.jpg">
    </a>
    </div>
                                </div>
                            </div>

                        </div>
                    </section>
                

                <!-- VIDEO GALLERY -->
                        <section class="video-gallery autoplay-video-section" data-section-order="gallery_video">
                            <div class="inner"><div class="title" data-aos="zoom-out" data-aos-duration="1000">
                                    <h1 data-aos="zoom-out-up" data-aos-duration="1000">Our Footage</h1>
                                    
                                </div><div class="video-outer"><div class="video">
                                        <div class="preview autoplay-video-box" data-aos="zoom-in" data-aos-duration="1000">
                                            <div class="autoplay-video" data-url="https://www.youtube.com/watch?v=aYbUY6JGpbM"></div>
                                            <img src="/templates/imagine/orn-20-min.png" alt="">
                                            <button class="play-btn" data-video-id="aYbUY6JGpbM"><i class="fas fa-play"></i></button>
                                        </div>
                                        
                                    </div></div>
                            </div>
                        </section>
                                    <!-- STORY -->
                    <section class="love-story" data-section-order="love_story">
                        <div class="story-inner">

                                                            <div class="story-head">
                                    <h1 class="story-title" data-aos="zoom-in" data-aos-duration="1000">Our Love Story</h1>
                                </div>
                                                    
                            <div class="story-body">

                                <!-- Preview -->
                                <div class="story__slider-preview" id="story__slider-preview">
                                                                            <div class="">
                                            <div class="story-preview">
                                                <div class="story-picture lightgallery">
                                                    <a href="/templates/imagine/orn-20-min.png">
                                                        <img src="/templates/imagine/orn-20-min.png" alt="">
                                                    </a>
                                                </div>
                                                <h3 class="story-sub-title" data-aos="fade-up" data-aos-duration="1000">First Date</h3>                                            </div>
                                        </div>
                                                                            <div class="">
                                            <div class="story-preview">
                                                <div class="story-picture lightgallery">
                                                    <a href="/templates/imagine/orn-20-min.png">
                                                        <img src="/templates/imagine/orn-20-min.png" alt="">
                                                    </a>
                                                </div>
                                                <h3 class="story-sub-title" data-aos="fade-up" data-aos-duration="1000">We&#039;re Forever</h3>                                            </div>
                                        </div>
                                                                    </div>

                                <div class="story__slider-caption-wrap">
                                    <div class="orn-story">
                                        <div class="image-wrap" data-aos="zoom-in" data-aos-duration="1000">
                                            <svg class="orn-story-svg" viewBox="0 0 108 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_2177_7054)">
        <path d="M58.5 5.19981C58.2303 5.26892 57.9444 5.23319 57.7 5.09981C57.5583 5.05684 57.4295 4.97961 57.3248 4.87495C57.2202 4.7703 57.1429 4.64145 57.1 4.49981C56.9919 4.24352 56.9447 3.96566 56.962 3.68806C56.9794 3.41045 57.0608 3.14065 57.2 2.89981L57.8 2.39981L58.6 2.09981C59.162 2.063 59.7214 2.20286 60.2 2.49981C60.6927 2.80843 61.0772 3.26277 61.3 3.7998C61.4333 4.32215 61.4672 4.86492 61.4 5.39981C61.3146 5.98633 61.0728 6.53902 60.7 6.99981C60.399 7.43662 59.9839 7.78251 59.5 7.99981L59.1 8.19981H57.9C57.3318 8.26595 56.7565 8.23211 56.2 8.09981C55.1367 7.79081 54.1942 7.16243 53.5 6.2998C53.1947 5.82139 52.9272 5.31987 52.7 4.7998V4.39981C52.7022 4.26003 52.6677 4.12212 52.6 3.99981V3.19981C52.6247 2.0912 52.9722 1.01387 53.6 0.0998077V-0.200195L53.8 -0.000190735L54.3 0.699806L54.6 1.49981C54.8377 2.00147 54.9737 2.54528 55 3.09981C54.9973 3.6794 54.8959 4.2543 54.7 4.7998C54.5692 5.31105 54.3305 5.7884 54 6.19981C53.3114 7.09008 52.3705 7.75219 51.3 8.09981C50.2 8.40374 49.0271 8.29711 48 7.7998C47.5037 7.55743 47.0615 7.21729 46.7 6.7998C46.4149 6.33818 46.2119 5.83069 46.1 5.2998C45.9792 4.73451 46.0137 4.14704 46.2 3.59981C46.3843 3.06993 46.7351 2.6139 47.2 2.2998C47.6892 2.02896 48.2409 1.89106 48.8 1.89981C49.1 1.99981 49.4 1.99981 49.6 2.19981C49.7284 2.23863 49.8477 2.30291 49.9508 2.38881C50.0539 2.47471 50.1386 2.58047 50.2 2.69981C50.3554 2.93259 50.4545 3.19841 50.4892 3.47616C50.5239 3.75391 50.4933 4.03592 50.4 4.2998C50.2539 4.54731 50.0475 4.75374 49.8 4.89981C49.5528 5.02441 49.2702 5.05973 49 4.99981C49.1174 5.03126 49.2399 5.03862 49.3602 5.02143C49.4805 5.00424 49.5961 4.96288 49.7 4.89981C49.8161 4.86036 49.9215 4.79474 50.0082 4.70805C50.0949 4.62135 50.1605 4.51589 50.2 4.39981C50.3075 4.16072 50.3546 3.89888 50.3371 3.63733C50.3197 3.37577 50.2382 3.12251 50.1 2.89981L49.5 2.39981L48.8 2.19981C48.3023 2.17801 47.811 2.31838 47.4 2.59981C47.1725 2.72335 46.9744 2.8945 46.819 3.10159C46.6637 3.30868 46.5549 3.54683 46.5 3.7998C46.3197 4.27905 46.2849 4.80087 46.4 5.2998C46.4948 5.80486 46.6996 6.28284 47 6.69981C47.307 7.10713 47.723 7.41917 48.2 7.59981L48.5 7.7998H49.7L51.2 7.59981C52.1645 7.31105 53.0076 6.71385 53.6 5.89981C53.9613 5.49397 54.2338 5.01711 54.4 4.49981C54.5157 4.00759 54.5827 3.50516 54.6 2.99981C54.4907 1.98481 54.1108 1.01779 53.5 0.199806H53.8C53.2642 1.07693 52.955 2.07349 52.9 3.09981V3.89981C52.9362 3.94039 52.9637 3.98792 52.9809 4.03951C52.9981 4.09109 53.0046 4.14563 53 4.19981V4.59981C53.1727 5.06315 53.4082 5.50057 53.7 5.89981C53.9826 6.3353 54.3493 6.70999 54.7786 7.00191C55.2078 7.29383 55.6911 7.4971 56.2 7.59981C56.6821 7.76377 57.1917 7.83171 57.7 7.7998H58.9L59.2 7.59981C59.677 7.41917 60.093 7.10713 60.4 6.69981C60.7003 6.28284 60.9052 5.80486 61 5.2998C61.0669 4.79813 61.0329 4.28816 60.9 3.7998C60.7193 3.32283 60.4073 2.90677 60 2.59981C59.589 2.31838 59.0976 2.17801 58.6 2.19981L57.8 2.39981C57.6 2.59981 57.4 2.69981 57.3 2.89981C57.1455 3.11392 57.0463 3.36294 57.0114 3.62467C56.9765 3.8864 57.007 4.1527 57.1 4.39981C57.2126 4.61291 57.3869 4.78715 57.6 4.89981C57.8444 5.03319 58.1303 5.06892 58.4 4.99981L58.5 5.19981Z" fill="#8F3B0C"/>
        <path d="M49.0005 9.59986C49.1307 9.54421 49.2734 9.52415 49.414 9.54172C49.5545 9.55929 49.6879 9.61386 49.8004 9.69986L50.4004 10.1999C50.4938 10.4637 50.5244 10.7458 50.4896 11.0235C50.4549 11.3013 50.3559 11.5671 50.2004 11.7999C50.1575 11.9415 50.0803 12.0704 49.9756 12.175C49.8709 12.2797 49.7421 12.3569 49.6004 12.3999L48.8004 12.5999C48.2484 12.6983 47.6794 12.5916 47.2004 12.2999C46.7598 11.9608 46.4152 11.5127 46.2004 10.9999C46.019 10.4517 45.9845 9.86551 46.1004 9.29986C46.2124 8.76897 46.4154 8.26148 46.7004 7.79986C47.0867 7.38092 47.5234 7.01144 48.0005 6.69986H48.4004L48.8004 6.49986H49.6004C50.1418 6.45996 50.6856 6.52794 51.2004 6.69986C52.3029 6.98359 53.2846 7.61474 54.0005 8.49986C54.2929 8.93453 54.5282 9.40507 54.7004 9.89986V10.2999C54.7813 10.4534 54.816 10.627 54.8004 10.7999C54.8906 11.0563 54.9247 11.3291 54.9004 11.5999C54.8757 12.7085 54.5282 13.7858 53.9004 14.6999L53.7004 14.9999V14.6999C53.4797 14.5104 53.3081 14.2702 53.2004 13.9999L52.8004 13.2999C52.604 12.7892 52.5024 12.247 52.5005 11.6999C52.4115 11.1255 52.4806 10.5379 52.7004 9.99986C52.907 9.50133 53.1758 9.03093 53.5005 8.59986C54.1702 7.69005 55.118 7.02308 56.2004 6.69986C57.2543 6.36169 58.3969 6.4331 59.4004 6.89986C59.9177 7.15391 60.3643 7.53176 60.7004 7.99986C61.0698 8.42432 61.3124 8.94411 61.4004 9.49986C61.4666 10.068 61.4327 10.6434 61.3004 11.1999C61.0776 11.7369 60.6932 12.1912 60.2004 12.4999C59.76 12.7947 59.2204 12.9026 58.7004 12.7999C58.4179 12.8394 58.1311 12.7677 57.9004 12.5999C57.6016 12.4921 57.3526 12.2787 57.2004 11.9999C57.0613 11.759 56.9798 11.4892 56.9625 11.2116C56.9451 10.934 56.9924 10.6562 57.1004 10.3999C57.1618 10.2805 57.2465 10.1748 57.3496 10.0889C57.4527 10.003 57.572 9.93869 57.7004 9.89986C57.4873 10.0125 57.3131 10.1868 57.2004 10.3999C57.1065 10.63 57.0755 10.8809 57.1107 11.127C57.1458 11.373 57.2458 11.6053 57.4004 11.7999C57.5384 12.0187 57.7306 12.1982 57.9584 12.3209C58.1861 12.4435 58.4418 12.5052 58.7004 12.4999C59.1875 12.5588 59.6803 12.4532 60.1004 12.1999C60.5318 11.9176 60.8503 11.4929 61.0005 10.9999C61.1333 10.5115 61.1673 10.0015 61.1004 9.49986C61.0056 8.99481 60.8008 8.51682 60.5005 8.09986C60.1474 7.71394 59.7437 7.37756 59.3004 7.09986H57.8004C57.2922 7.06795 56.7826 7.1359 56.3004 7.29986C55.2925 7.55346 54.4068 8.1557 53.8004 8.99986C53.529 9.41154 53.2947 9.84659 53.1004 10.2999C52.9365 10.782 52.8685 11.2916 52.9004 11.7999C52.9434 12.8601 53.3294 13.8778 54.0005 14.6999H53.6004C54.1676 13.8303 54.5111 12.8342 54.6004 11.7999C54.6167 11.5293 54.5828 11.2581 54.5005 10.9999V10.6999L54.3004 10.2999C54.1696 9.78861 53.9309 9.31127 53.6004 8.89986C52.9671 8.08386 52.0921 7.48886 51.1004 7.19986H48.2004C47.7386 7.45109 47.3308 7.7909 47.0005 8.19986C46.7001 8.61682 46.4952 9.09481 46.4004 9.59986C46.2853 10.0988 46.3201 10.6206 46.5005 11.0999C46.5554 11.3528 46.6642 11.591 46.8195 11.7981C46.9748 12.0052 47.173 12.1763 47.4004 12.2999C47.8206 12.5532 48.3134 12.6588 48.8004 12.5999C48.9246 12.6243 49.0528 12.6189 49.1745 12.5841C49.2962 12.5493 49.4079 12.4862 49.5005 12.3999C49.8005 12.2999 49.9004 12.0999 50.1004 11.8999C50.2389 11.696 50.321 11.4591 50.3386 11.2133C50.3561 10.9675 50.3085 10.7214 50.2004 10.4999C50.161 10.3838 50.0954 10.2783 50.0087 10.1916C49.922 10.1049 49.8165 10.0393 49.7004 9.99986C49.6094 9.91121 49.4925 9.85376 49.3667 9.83578C49.2409 9.81781 49.1127 9.84025 49.0005 9.89986V9.59986Z" fill="#8F3B0C"/>
        <path d="M60.2004 7.1L106.4 7.3H106.5C106.5 7.32652 106.49 7.35196 106.471 7.37071C106.452 7.38947 106.427 7.4 106.4 7.4L60.2004 7.6C60.1208 7.6 60.0445 7.56839 59.9883 7.51213C59.932 7.45587 59.9004 7.37956 59.9004 7.3C59.9004 7.22043 59.932 7.14413 59.9883 7.08787C60.0445 7.03161 60.1208 7 60.2004 7V7.1Z" fill="#8F3B0C"/>
        <path d="M47.3004 7.69981L0.900391 7.49981L47.3004 7.2998C47.3799 7.2998 47.4563 7.33141 47.5125 7.38767C47.5688 7.44393 47.6004 7.52024 47.6004 7.59981C47.6004 7.67937 47.5688 7.75568 47.5125 7.81194C47.4563 7.8682 47.3799 7.89981 47.3004 7.89981V7.69981Z" fill="#8F3B0C"/>
        <path d="M1 8.3999C1.55228 8.3999 2 7.95219 2 7.3999C2 6.84762 1.55228 6.3999 1 6.3999C0.447715 6.3999 0 6.84762 0 7.3999C0 7.95219 0.447715 8.3999 1 8.3999Z" fill="#8F3B0C"/>
        <path d="M106.5 8.3999C107.052 8.3999 107.5 7.95219 107.5 7.3999C107.5 6.84762 107.052 6.3999 106.5 6.3999C105.948 6.3999 105.5 6.84762 105.5 7.3999C105.5 7.95219 105.948 8.3999 106.5 8.3999Z" fill="#8F3B0C"/>
        <path d="M49.1996 5.2C49.531 5.2 49.7996 4.93137 49.7996 4.6C49.7996 4.26863 49.531 4 49.1996 4C48.8682 4 48.5996 4.26863 48.5996 4.6C48.5996 4.93137 48.8682 5.2 49.1996 5.2Z" fill="#8F3B0C"/>
        <path d="M58.8998 4.6C58.9018 4.74323 58.8525 4.88245 58.7608 4.99249C58.6691 5.10254 58.5411 5.17614 58.3998 5.2C58.2407 5.2 58.0881 5.13678 57.9755 5.02426C57.863 4.91174 57.7998 4.75913 57.7998 4.6C57.7998 4.44087 57.863 4.28826 57.9755 4.17574C58.0881 4.06321 58.2407 4 58.3998 4C58.5411 4.02386 58.6691 4.09746 58.7608 4.2075C58.8525 4.31755 58.9018 4.45677 58.8998 4.6Z" fill="#8F3B0C"/>
        <path d="M58.9 10.1001C58.9 10.5001 58.7 10.7001 58.4 10.7001C58.3173 10.7193 58.2311 10.7171 58.1495 10.6937C58.0679 10.6703 57.9936 10.6266 57.9336 10.5666C57.8735 10.5065 57.8298 10.4322 57.8064 10.3506C57.7831 10.269 57.7809 10.1828 57.8 10.1001C57.8 9.8001 58 9.6001 58.4 9.6001C58.5326 9.6001 58.6598 9.65278 58.7536 9.74654C58.8473 9.84031 58.9 9.96749 58.9 10.1001Z" fill="#8F3B0C"/>
        <path d="M49.7998 10.1002C49.7998 10.2593 49.7366 10.4119 49.6241 10.5244C49.5116 10.6369 49.359 10.7002 49.1998 10.7002C49.1171 10.7193 49.0309 10.7171 48.9493 10.6938C48.8677 10.6704 48.7934 10.6266 48.7334 10.5666C48.6733 10.5066 48.6296 10.4323 48.6062 10.3507C48.5829 10.2691 48.5807 10.1829 48.5998 10.1002C48.5998 9.80016 48.7998 9.60016 49.1998 9.60016C49.3431 9.59816 49.4823 9.64746 49.5923 9.73916C49.7024 9.83087 49.776 9.95891 49.7998 10.1002Z" fill="#8F3B0C"/>
    </g>
    <defs>
        <clipPath id="clip0_2177_7054">
            <rect width="107.5" height="14.7" fill="white"/>
        </clipPath>
    </defs>
</svg>                                        </div>
                                    </div>
                                    <!-- Caption -->
                                    <div class="story__slider-caption" id="story__slider-caption">
                                                                                    <div class="">
                                                <div class="story-details">
                                                    <p class="story-caption" data-aos="fade-up" data-aos-duration="1000">Daffa and Shakira’s love story is nothing but adorable! It is the simple things in life that keeps the sparkles flying. “Carson and I met in college through mutual friends. Our first date was watching his senior video and eating Taco Bell lol.”</p>                                                </div>
                                            </div>
                                                                                    <div class="">
                                                <div class="story-details">
                                                    <p class="story-caption" data-aos="fade-up" data-aos-duration="1000">“What we are looking forward to the most, besides getting to spend the rest of our lives together, is having everyone that we truly care about together, all in a place that is so beautiful itself.” We can not wait to meet, greet, and host your special day! It is an honor to be apart of your journey.</p>                                                </div>
                                            </div>
                                                                            </div>
                                </div>

                                <!-- Dots -->
                                <div class="story__slider-dots" id="story__slider-dots"></div>

                            </div>
                        </div>

                    </section>    
                
                                    <div data-section-order="wedding_gift">
                        <!-- WEDDING GIFT -->
                                                    <section class="wedding-gift-wrap ">
                                <div class="wedding-gift-inner">

                                    <div class="wedding-gift-head">
                                        <h1 class="wedding-gift-title" data-aos="zoom-in" data-aos-duration="1500">Wedding Gift</h1>
                                        <p class="wedding-gift-description" data-aos="fade-up" data-aos-duration="1000">Your blessing and coming to our wedding are enough for us. However, if you want to give a gift we provide a Digital Envelope to make it easier for you. thank you</p>
                                    </div>

                                    <div class="wedding-gift-body">
                                        <div class="ornaments-wrapper">
                                            <!-- BACK TOP RIGHT -->
                                            <div class="orn-gift--back-top right">
                                                <div class="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="200">
                                                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                                </div>
                                            </div>
                                            <!-- BACK TOP LEFT -->
                                            <div class="orn-gift--back-top left">
                                                <div class="image-wrap" data-aos="fade-up-left" data-aos-duration="1200" data-aos-delay="200">
                                                    <img src="/templates/imagine/orn-07-min.png" alt="Ornament">
                                                </div>
                                            </div>
                                            <!-- BACK TOP RIGHT -->
                                            <div class="orn-gift--back-top-2 right">
                                                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                                    <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                                </div>
                                            </div>
                                            <!-- BACK TOP LEFT -->
                                            <div class="orn-gift--back-top-2 left">
                                                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                                    <img src="/templates/imagine/orn-22-min.png" alt="Ornament">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="wedding-gift-body-inner">
                                            <div class="ornaments-wrapper">
                                                <!-- FRONT TOP RIGHT -->
                                                <div class="orn-gift--front-top right">
                                                    <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                                        <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                                    </div>
                                                </div>
                                                <!-- FRONT TOP 2 RIGHT -->
                                                <div class="orn-gift--front-top-2 right">
                                                    <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                                        <img src="/templates/imagine/orn-01-min.png" alt="Ornament">
                                                    </div>
                                                </div>
                                                <!-- FRONT TOP 2 LEFT -->
                                                <div class="orn-gift--front-top-2 left">
                                                    <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                                        <img src="/templates/imagine/orn-01-min.png" alt="Ornament">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="wedding-gift-form">                
                                                <form action="" method="POST" id="weddingGiftForm">
            
                                                    <!-- Details -->
                                                    <div class="wedding-gift-details wedding-gift__first-slide wedding-gift-slide">

                                                            <div class="wedding-gift-slide">
        <div class="wedding-gift-select-bank-wrap">
            <select name="select_bank" id="selectBank" class="form-control"></select>
        </div>
        <div class="wedding-gift-bank-wrap">
                <div class="bank-item" id="savingBook11036">
        <div class="bank-detail">
            <h3 class="bank-name">BANK BCA (014)</h3>
            <div>
                <small class="bank-account-number-label">Account Number</small>
                <h4 class="bank-account-number" data-copy="8375180797">8375180797 <i class="ph ph-copy-simple"></i></h4>
            </div>
            <div>
                <small class="bank-account-name-label">Account Name</small>
                <h4 class="bank-account-name">Muhammad Fanny Al farizzy</h4>
            </div>
        </div>
        
    </div>
        </div>
    </div>            
                                                                                                                    <!-- Sender Data -->
                                                            <div class="wedding-gift-sender-data-wrap">
                                                                <!-- <label>Fill the form below, please</label> -->
            
                                                                <div class="form-group">
                                                                    <input type="text" class="form-control" name="name" placeholder="Name" value="Katsudoto">
                                                                </div>
            
                                                                <div class="form-group">
                                                                    <input type="text" class="form-control" name="account_name" placeholder="Account Owner Name">
                                                                </div>
            
                                                                <div class="form-group">
                                                                    <textarea name="message" rows="1" class="form-control" placeholder="Message"></textarea>
                                                                </div>
            
                                                                <div class="form-group">
                                                                    <input type="number" class="form-control" name="amount" placeholder="Amount">
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <input type="file" name="picture" id="weddingGiftPicture" data-wgu-preview="#weddingGiftPreview" style="display: none;">
                                                                <input type="hidden" name="template" value="chitra">
                                                                <input type="hidden" name="post" value="sendGift">
                                                            </div>
            
                                                            <!-- Wedding Gift Page -->
                                                            <div class="wedding-gift-page-wrap">
                                                                <button type="button" class="wedding-gift-page wedding-gift__next">Next</button>
                                                            </div>
                                                                    
                                                    </div>
            
                                                                                                            <!-- Picture -->
                                                        <div class="wedding-gift-picture wedding-gift-slide">
                                                            <!-- Wedding Gift Back -->
                                                            <div class="wedding-gift-back-page-wrap">
                                                                <button type="button" class="wedding-gift-back-page wedding-gift__prev"><i class="fas fa-chevron-left"></i></button>
                                                            </div>

                                                                        
                                                            <!-- Wedding Gift Upload -->
                                                            <div class="wedding-gift-upload-wrap" data-wgu-file="#weddingGiftPicture">
                                                                <div class="wgu-description show">
                                                                    <img class="wgu-icon" src="/templates/imagine/orn-20-min.png" alt="">
                                                                    <p class="wgu-title">Upload proof of transfer</p>
                                                                    <p class="wgu-desc">Screen Shoot / Photo Slip Transfer</p>
                                                                </div>
            
                                                                <div class="wgu-img-wrap">
                                                                    <img class="wgu-img" id="weddingGiftPreview" src="" alt="">
                                                                </div>
                                                            </div>
            
                                                            <!-- Wedding Gift Page -->
                                                            <div class="wedding-gift-page-wrap">
                                                                <button type="submit" class="wedding-gift-page submit">Confirm</button>
                                                            </div>
                                                        </div>
                                                                
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        
                        <!-- KADO AMPLOP -->
                                                    <section id="wedding-gifts" class="container wedding-gifts-wrap">
                                    
                            </section>
                                            </div>
                
                <!-- Instagram Filter -->
                <section class="ig-filter-wrap" data-section-order="filter_instagram">
                    <div class="ig-filter">
                        <div class="ig-filter-head">
                            <h2 class="ig-filter-title" data-aos="fade-up" data-aos-duration="1200">Wedding Filter</h2>

                                                            <p class="ig-filter-caption" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">Capture your moment while attending our wedding by using the Instagram filter below.</p>
                                                    </div>

                        <div class="ig-filter-body">
                                                            <div class="ig-filter-body-inner">
                                    <!-- THUMBNAIL -->
                                    <div class="ig-filter-img-wrap z-1" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                        <img class="ig-filter-img" src="/templates/imagine/orn-20-min.png" alt="Instagram Filter Preview">
                                    </div>
                                </div>
                            
                                                                    <div class="ig-filter-link-wrap" data-aos="zoom-in" data-aos-duration="1200" data-aos-delay="400">
                                        <a class="ig-filter-link" href="https://www.instagram.com/ar/899082187267628/" target="_blank">Use Filter</a>
                                    </div>
                                                            </div>
                        </div>
                    </section>

                                    <!-- WEDDING WISH -->
                    <section class="wedding-wish-wrap" data-template="" data-section-order="wedding_wish">

                        <div class="ornaments-wrapper">
                            <!-- BOTTOM CENTER -->
                            <div class="orn-wish--bottom-center">
                                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                    <img src="/templates/imagine/orn-13-min.png" alt="Ornament">
                                </div>
                            </div>
                            <!-- BOTTOM LEFT -->
                            <div class="orn-wish--bottom left">
                                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                    <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                </div>
                            </div>
                            <!-- BOTTOM RIGHT -->
                            <div class="orn-wish--bottom right">
                                <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                    <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                </div>
                            </div>
                        </div>
                        <div class="wedding-wish-inner">
                            <div class="wedding-wish-head">
                                <h1 class="wedding-wish-title" data-aos="fade-up" data-aos-duration="1200">Wedding Wish</h1>
                                                            </div>

                            <div class="wedding-wish-body">

                                                                    <div class="wedding-wish-form">
                                        <form action="" class="" method="POST" id="weddingWishForm">

                                            <div>
                                                <input type="hidden" name="guestId" value="1892700">
                                                <input type="hidden" name="code" value="968801">
                                                <input type="hidden" name="post" value="newComment">
                                            </div>

                                            <div class="form-group guest-name-wrap  hide " data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                                <input type="text" name="name" class="form-control guest-name" placeholder="Name" value="Katsudoto">
                                            </div>

                                            <div class="form-group guest-comment-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                                                <textarea class="form-control guest-comment" name="comment" rows="1" placeholder="Give your wish"></textarea>
                                            </div>

                                            <div class="submit-comment-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                                                <button type="submit" class="submit submit-comment" data-last="">Send</button>
                                            </div>

                                        </form>
                                    </div>
                                
                                <div class="comment-wrap">
                                    <!-- COMMENTS -->

                                </div>

                                <div class="more-comment-wrap" data-aos="fade-up" data-aos-duration="1200">
                                    <button type="button" id="moreComment" data-template="" data-start="0" data-load-text="Loading">Show more comments</button>
                                </div>

                            </div>

                        </div>
                    </section>
                
                <!-- CATATAN -->
                <section class="notes-container" data-section-order="greet_thanks">
                    <div class="note">
                        <h4 class="note-title">Thank You</h4>
                        <p class="note-description">Family &amp; Friends<br />
<br />
From the bottom of our hearts we just want to thank you for being part of our big day. We are extreamly lucky to have each of you in our lives and honered you could be here with us.</p>
                    </div>
                </section>

                <!-- Footnote -->
                <section class="footnote-wrap" data-section-order="footnote">
                    <div class="footnote-inner">
                        <div class="ornaments-wrapper">
                            <!-- TOP LEFT -->
                            <div class="orn-footnote--top-left">
                                <!-- LAMP 1 -->
                                <div class="orn-footnote--top-left--lamp-1">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="600">
                                        <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                    </div>
                                </div>

                                <!-- LAMP 2 -->
                                <div class="orn-footnote--top-left--lamp-2">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="700">
                                        <img src="/templates/imagine/orn-18-min.png" alt="Ornament">
                                    </div>
                                </div>
                                
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="400">
                                    <img src="/templates/imagine/orn-16-min.png" alt="Ornament">
                                </div>
                                
                                <!-- FLOWER 1 -->
                                <div class="orn-footnote--top-left--flower-1">
                                    <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                        <img src="/templates/imagine/orn-19-min.png" alt="Ornament">
                                    </div>
                                </div>

                            </div>

                            <!-- TOP RIGHT -->
                            <div class="orn-footnote--top-right">
                                <div class="image-wrap" data-aos="fade-down" data-aos-duration="1200" data-aos-delay="450">
                                    <img src="/templates/imagine/orn-17-min.png" alt="Ornament">
                                </div>
                            </div>
                        </div>

                        <!-- GARDEN -->
                        <div class="footnote-garden">
                            <!-- GATE -->
                            <div class="footnote-gate">
                                <div class="image-wrap" data-aos="zoom-out" data-aos-duration="1200" data-aos-delay="600">
                                    <img src="/templates/imagine/orn-10-min.png" alt="Ornament">
                                </div>
                                <div class="ornaments-wrapper">
                                    
                                    
                                    <!-- BOTTOM CENTER -->
                                    <div class="orn-footnote--bottom-center">
                                        <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                            <img src="/templates/imagine/orn-13-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <!-- BOTTOM LEFT -->
                                    <div class="orn-footnote--bottom left">
                                        <!-- FLOWER -->
                                        <div class="orn-footnote--bottom-flower left">
                                            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                                                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <!-- LEAF -->
                                        <div class="orn-footnote--bottom-leaf left">
                                            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                                                <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                            <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                    <!-- BOTTOM RIGHT -->
                                    <div class="orn-footnote--bottom right">
                                        <!-- FLOWER -->
                                        <div class="orn-footnote--bottom-flower left">
                                            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="400">
                                                <img src="/templates/imagine/orn-11-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <!-- LEAF -->
                                        <div class="orn-footnote--bottom-leaf left">
                                            <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="300">
                                                <img src="/templates/imagine/orn-12-min.png" alt="Ornament">
                                            </div>
                                        </div>
                                        <div class="image-wrap" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
                                            <img src="/templates/imagine/orn-14-min.png" alt="Ornament">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- DETAILS -->
                            <div class="footnote-details">
                                <div class="footnote-details--content">
                                    <p class="top-text" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="600">Wedding Invitation</p>                
                                    <h2 class="footnote-title" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="800">Aurora<br>&<br>Matthew</h2>
                                    <p class="bottom-text" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="1000">#PromDateToLifeMate</p>        
                                </div>
                            </div>
                        </div>

                        <section class="effects nanda" data-aos="zoom-out" data-aos-duration="2000" data-aos-delay="500">
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                            <div><img src="/templates/imagine/orn-20-min.png" alt=""></div>
                        </section>

                    </div>
                </section>

                <!-- FOOTER -->
                <section class="footer" data-section-footer>
                    <div class="footer-inner  flex-column ">
                         
                    </div>
                </section>
                
            </section>
            
        </section>

        <!-- MUSIC -->
        <section class="music-outer" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
            <div class="music-box auto" id="music-box"></div>
        </section>
         

        
<!-- ALERT -->
<div class="alert" id="alert">
    <div class="alert-text"></div>
    <div class="alert-close fas fa-times"></div>
</div>

<!-- MODAL -->
<div id="modal" class="modal modal-center"></div>


<!-- Plugins -->
 
 
 
 
 
 

<!-- Video JS -->
 
 
 

 

<!-- Partial -->
 
 


         
         
    `

export default function Imagine(props: TemplateProps) {
  const { groom_name, bride_name, estimated_wedding_date, cover_photos, gallery_photos, groom_photo_url, bride_photo_url, wedding_profile_id, guest_id, guest_slug, guest_link_strict, guest_name, feature_gates, track_url, auto_play } = props
  const gates = feature_gates || {}
  const [opened, setOpened] = useState(false)
  const openInvitation = () => { setOpened(true); if (typeof window !== "undefined") window.scrollTo(0, 0) }

  const showGuestDock =
    opened &&
    (!!guest_id || (guest_link_strict === false && !!guest_slug)) &&
    !!wedding_profile_id

  const coupleLabel = `${groom_name || ""} & ${bride_name || ""}`.trim()

  const groomPhoto = Array.isArray(groom_photo_url) ? groom_photo_url[0] : groom_photo_url
  const bridePhoto = Array.isArray(bride_photo_url) ? bride_photo_url[0] : bride_photo_url
  const cover = (cover_photos && cover_photos[0]) || ""

  let html = RAW_HTML
  // AOS animation library (CDN) for data-aos attributes
  html = '<link rel="stylesheet" href="https://unpkg.com/aos@2.3.4/dist/aos.css" />' + html
  html = html + '<script src="https://unpkg.com/aos@2.3.4/dist/aos.js"></script><script>AOS.init({duration:800,once:true});</script>'
  // asset urls already local
  // names
  if (groom_name) html = html.split("Aurora").join(groom_name)
  if (bride_name) html = html.split("Matthew").join(bride_name)
  // date
  if (estimated_wedding_date) html = html.split("Saturday, October 05th 2024").join(estimated_wedding_date)
  // cover photo
  if (cover) {
    html = html.replace(/https:\/\/img\.katsudoto\.id\/mwj7BFcUHDF_kza8dlpx0cpxM1Ktp5XK3TvyA2PPJ0M[^"]*/g, cover)
    html = html.replace(/https:\/\/img\.katsudoto\.id\/ZArmSOKSxnqhbBCgOkhv0L1osodnun5Hg2DifWD98tI[^"]*/g, cover)
  }
  // mempelai photos
  if (groomPhoto) {
    html = html.replace(/https:\/\/img\.katsudoto\.id\/dFdzzacMdzplHIsxhE-NvthxTij3hgi7j8qMdv8LKD0[^"]*/g, groomPhoto)
    html = html.replace(/https:\/\/img\.katsudoto\.id\/mAJjoSq2XJTHN_YsPJ_7xn3iGTXv_ht71dq01MIRZj0[^"]*/g, groomPhoto)
  }
  if (bridePhoto) {
    html = html.replace(/https:\/\/img\.katsudoto\.id\/SVfRKR0KdwqjabM6MGj2XFIyjpGh49Oz1HHgMp5UdL4[^"]*/g, bridePhoto)
    html = html.replace(/https:\/\/img\.katsudoto\.id\/eQ0xmvNen5WZC6EZD8aZE7YxYkaeK2_o4cJUBK-WAWI[^"]*/g, bridePhoto)
  }

  return (
    <div className={`imagine-root${opened ? " is-open" : ""}`} onClick={(e) => {
      const t = e.target as HTMLElement
      if (t && t.textContent && t.textContent.trim() === "Open Invitation") { e.preventDefault(); openInvitation() }
    }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {opened && wedding_profile_id && (
        <Wishes weddingProfileId={wedding_profile_id} guestId={guest_id} guestName={guest_name} coupleName={coupleLabel} />
      )}
      {opened && track_url && (
        <audio src={track_url} loop preload="auto" autoPlay={auto_play} style={{ display: "none" }} />
      )}
      {showGuestDock && (
        <InvitationOverlay
          guestId={guest_id}
          guestSlug={guest_slug}
          allowFlexibleRsvp={guest_link_strict === false}
          guestName={guest_name || "Tamu Undangan"}
          coupleName={coupleLabel}
          weddingProfileId={wedding_profile_id!}
          guestQrUrl={props.guest_qr_url}
          guestTableNumber={props.guest_table_number}
          guestRsvpStatus={props.guest_rsvp_status}
          guestRsvpMessage={props.guest_rsvp_message || undefined}
          rsvpMaxPax={props.rsvp_max_pax ?? 2}
          qrEnabled={gates.qr_code_book === true}
          anchor="center"
        />
      )}
    </div>
  )
}
